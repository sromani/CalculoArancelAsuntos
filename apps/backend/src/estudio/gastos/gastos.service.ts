import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { gastoInputSchema } from '@shared/schemas';
import type { EstudioSession, GastosListadoResponse } from '@shared/types';
import { parseFechaGasto } from '@shared/utils';
import { PrismaEstudioService } from '../../prisma/prisma-estudio.service';
import { esSoloLectura, puedeGestionarGastos } from '../auth/estudio-session';
import { construirWhereGastos, gastoInclude, parsePaginacionParams } from './gastos-query';
import { serializarGasto } from './gastos-serializer';

@Injectable()
export class GastosService {
  constructor(private prisma: PrismaEstudioService) {}

  async listar(query: Record<string, string | undefined>): Promise<GastosListadoResponse> {
    try {
      const where = construirWhereGastos(query);
      const { page, pageSize, skip } = parsePaginacionParams(query);

      const [total, items] = await Promise.all([
        this.prisma.gasto.count({ where }),
        this.prisma.gasto.findMany({
          where,
          orderBy: [{ fecha: 'desc' }, { createdAt: 'desc' }],
          skip,
          take: pageSize,
          include: gastoInclude,
        }),
      ]);

      return {
        items: items.map(serializarGasto),
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      };
    } catch {
      throw new ServiceUnavailableException('No se pudo acceder a la base del estudio.');
    }
  }

  async crear(sesion: EstudioSession, body: unknown) {
    if (!puedeGestionarGastos(sesion.rol)) {
      throw new ForbiddenException('No tenés permiso para crear gastos.');
    }

    const parsed = gastoInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues.map((e) => e.message).join(', '));
    }

    const data = parsed.data;
    const fecha = parseFechaGasto(data.fecha);
    if (!fecha) throw new BadRequestException('Fecha inválida.');

    const fechaVencimiento = data.fechaVencimiento ? parseFechaGasto(data.fechaVencimiento) : null;
    if (data.fechaVencimiento && !fechaVencimiento) {
      throw new BadRequestException('Fecha de vencimiento inválida.');
    }

    if (data.clienteId) {
      const cliente = await this.prisma.cliente.findUnique({ where: { id: data.clienteId } });
      if (!cliente) throw new BadRequestException('Cliente no encontrado.');
    }
    if (data.asuntoId) {
      const asunto = await this.prisma.asunto.findUnique({ where: { id: data.asuntoId } });
      if (!asunto) throw new BadRequestException('Asunto no encontrado.');
    }

    const creado = await this.prisma.gasto.create({
      data: {
        nombre: data.nombre,
        categoria: data.categoria as never,
        oficinaPublica: data.oficinaPublica ?? null,
        descripcion: data.descripcion ?? null,
        fecha,
        fechaVencimiento,
        importe: data.importe,
        moneda: data.moneda as never,
        estado: (data.estado ?? 'PENDIENTE') as never,
        observaciones: data.observaciones ?? null,
        catalogoItemId: data.catalogoItemId ?? null,
        clienteId: data.clienteId ?? null,
        asuntoId: data.asuntoId ?? null,
      },
      include: gastoInclude,
    });

    return serializarGasto(creado);
  }

  async obtener(id: string) {
    const g = await this.prisma.gasto.findUnique({ where: { id }, include: gastoInclude });
    if (!g) throw new NotFoundException('Gasto no encontrado.');
    return serializarGasto(g);
  }

  async actualizar(sesion: EstudioSession, id: string, body: unknown) {
    if (esSoloLectura(sesion.rol) || !puedeGestionarGastos(sesion.rol)) {
      throw new ForbiddenException('No tenés permiso para editar gastos.');
    }
    const parsed = gastoInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues.map((e) => e.message).join(', '));
    }
    const data = parsed.data;
    const fecha = parseFechaGasto(data.fecha);
    if (!fecha) throw new BadRequestException('Fecha inválida.');
    const fechaVencimiento = data.fechaVencimiento ? parseFechaGasto(data.fechaVencimiento) : null;

    try {
      const actualizado = await this.prisma.gasto.update({
        where: { id },
        data: {
          nombre: data.nombre,
          categoria: data.categoria as never,
          oficinaPublica: data.oficinaPublica ?? null,
          descripcion: data.descripcion ?? null,
          fecha,
          fechaVencimiento,
          importe: data.importe,
          moneda: data.moneda as never,
          estado: (data.estado ?? 'PENDIENTE') as never,
          observaciones: data.observaciones ?? null,
          catalogoItemId: data.catalogoItemId ?? null,
          clienteId: data.clienteId ?? null,
          asuntoId: data.asuntoId ?? null,
        },
        include: gastoInclude,
      });
      return serializarGasto(actualizado);
    } catch {
      throw new NotFoundException('Gasto no encontrado.');
    }
  }

  async eliminar(sesion: EstudioSession, id: string) {
    if (esSoloLectura(sesion.rol) || !puedeGestionarGastos(sesion.rol)) {
      throw new ForbiddenException('No tenés permiso para eliminar gastos.');
    }
    try {
      await this.prisma.gasto.delete({ where: { id } });
      return { ok: true };
    } catch {
      throw new NotFoundException('Gasto no encontrado.');
    }
  }
}
