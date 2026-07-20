import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaEstudioService } from '../../prisma/prisma-estudio.service';
import { esSoloLectura, puedeGestionarGastos } from '../auth/estudio-session';
import type { EstudioSession } from '@shared/types';
import { CreatePresupuestoDto, UpdatePresupuestoDto } from './presupuestos.dto';
import { construirWherePresupuestos, presupuestoInclude, serializarPresupuesto } from './presupuestos-query';

@Injectable()
export class PresupuestosService {
  constructor(private prisma: PrismaEstudioService) {}

  private assertWrite(sesion: EstudioSession) {
    if (esSoloLectura(sesion.rol) || !puedeGestionarGastos(sesion.rol)) {
      throw new ForbiddenException('No tenés permiso para gestionar presupuestos.');
    }
  }

  async listar(query: Record<string, string | undefined>) {
    try {
      const where = construirWherePresupuestos(query);
      const items = await this.prisma.presupuestoNotarial.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        take: 200,
        include: presupuestoInclude,
      });
      return items.map(serializarPresupuesto);
    } catch {
      throw new ServiceUnavailableException('No se pudo acceder a la base del estudio.');
    }
  }

  async obtener(id: string) {
    const p = await this.prisma.presupuestoNotarial.findUnique({
      where: { id },
      include: presupuestoInclude,
    });
    if (!p) throw new NotFoundException('Presupuesto no encontrado.');
    return serializarPresupuesto(p);
  }

  async crear(sesion: EstudioSession, dto: CreatePresupuestoDto) {
    this.assertWrite(sesion);
    const cliente = await this.prisma.cliente.findUnique({ where: { id: dto.clienteId } });
    if (!cliente) throw new BadRequestException('Cliente no encontrado.');

    const creado = await this.prisma.presupuestoNotarial.create({
      data: {
        clienteId: dto.clienteId,
        titulo: dto.titulo?.trim() || null,
        estado: (dto.estado ?? 'BORRADOR') as never,
        honorarioArancel: dto.honorarioArancel ?? 0,
        honorarioACobrar: dto.honorarioACobrar ?? 0,
        totalGastos: dto.totalGastos ?? 0,
        totalPresupuesto: dto.totalPresupuesto ?? dto.honorarioACobrar ?? 0,
        notas: dto.notas?.trim() || null,
        createdById: sesion.sub,
        historial: {
          create: { usuarioId: sesion.sub, accion: 'CREAR', detalle: { estado: dto.estado ?? 'BORRADOR' } },
        },
      },
      include: presupuestoInclude,
    });
    return serializarPresupuesto(creado);
  }

  async actualizar(sesion: EstudioSession, id: string, dto: UpdatePresupuestoDto) {
    this.assertWrite(sesion);
    try {
      const actualizado = await this.prisma.presupuestoNotarial.update({
        where: { id },
        data: {
          ...(dto.titulo !== undefined ? { titulo: dto.titulo?.trim() || null } : {}),
          ...(dto.estado ? { estado: dto.estado as never } : {}),
          ...(dto.honorarioArancel !== undefined ? { honorarioArancel: dto.honorarioArancel } : {}),
          ...(dto.honorarioACobrar !== undefined ? { honorarioACobrar: dto.honorarioACobrar } : {}),
          ...(dto.totalGastos !== undefined ? { totalGastos: dto.totalGastos } : {}),
          ...(dto.totalPresupuesto !== undefined ? { totalPresupuesto: dto.totalPresupuesto } : {}),
          ...(dto.notas !== undefined ? { notas: dto.notas?.trim() || null } : {}),
          historial: {
            create: { usuarioId: sesion.sub, accion: 'ACTUALIZAR', detalle: {} },
          },
        },
        include: presupuestoInclude,
      });
      return serializarPresupuesto(actualizado);
    } catch {
      throw new NotFoundException('Presupuesto no encontrado.');
    }
  }

  async eliminar(sesion: EstudioSession, id: string) {
    this.assertWrite(sesion);
    try {
      await this.prisma.presupuestoNotarial.delete({ where: { id } });
      return { ok: true };
    } catch {
      throw new NotFoundException('Presupuesto no encontrado.');
    }
  }
}
