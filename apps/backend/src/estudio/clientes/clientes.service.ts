import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaEstudioService } from '../../prisma/prisma-estudio.service';
import { esSoloLectura } from '../auth/estudio-session';
import type { EstudioSession } from '@shared/types';
import { CreateClienteDto, UpdateClienteDto } from './clientes.dto';

function serializar(c: {
  id: string;
  tipoDocumento: string;
  tipoPersona: string;
  documento: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
  domicilio: string | null;
  createdAt: Date;
}) {
  return {
    id: c.id,
    tipoDocumento: c.tipoDocumento,
    tipoPersona: c.tipoPersona,
    documento: c.documento,
    nombre: c.nombre,
    email: c.email,
    telefono: c.telefono,
    domicilio: c.domicilio,
    createdAt: c.createdAt.toISOString(),
  };
}

@Injectable()
export class ClientesService {
  constructor(private prisma: PrismaEstudioService) {}

  private assertWrite(sesion: EstudioSession) {
    if (esSoloLectura(sesion.rol)) {
      throw new ForbiddenException('No tenés permiso para modificar clientes.');
    }
  }

  async listar(query: Record<string, string | undefined>) {
    const q = query.q?.trim();
    try {
      const clientes = await this.prisma.cliente.findMany({
        where: q
          ? {
              OR: [
                { nombre: { contains: q, mode: 'insensitive' } },
                { documento: { contains: q, mode: 'insensitive' } },
                { email: { contains: q, mode: 'insensitive' } },
                { telefono: { contains: q, mode: 'insensitive' } },
              ],
            }
          : undefined,
        orderBy: { createdAt: 'desc' },
        take: 500,
      });
      return clientes.map(serializar);
    } catch {
      throw new ServiceUnavailableException('No se pudo acceder a la base del estudio.');
    }
  }

  async obtener(id: string) {
    const c = await this.prisma.cliente.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Cliente no encontrado.');
    return serializar(c);
  }

  async crear(sesion: EstudioSession, dto: CreateClienteDto) {
    this.assertWrite(sesion);
    const tipoPersona = (dto.tipoPersona ?? 'FISICA') as 'FISICA' | 'JURIDICA';
    const nombre = dto.nombre.trim();
    if (tipoPersona === 'FISICA' && !nombre.includes(',')) {
      throw new BadRequestException('Use formato Apellido, Nombre para persona física.');
    }
    try {
      const c = await this.prisma.cliente.create({
        data: {
          nombre,
          documento: dto.documento.trim(),
          tipoDocumento: (dto.tipoDocumento ?? 'CI') as never,
          tipoPersona,
          email: dto.email?.trim() || null,
          telefono: dto.telefono?.trim() || null,
          domicilio: dto.domicilio?.trim() || null,
        },
      });
      return serializar(c);
    } catch (e: unknown) {
      if (typeof e === 'object' && e && 'code' in e && (e as { code: string }).code === 'P2002') {
        throw new ConflictException('Ya existe un cliente con ese documento.');
      }
      throw new ServiceUnavailableException('No se pudo crear el cliente.');
    }
  }

  async actualizar(sesion: EstudioSession, id: string, dto: UpdateClienteDto) {
    this.assertWrite(sesion);
    const existente = await this.prisma.cliente.findUnique({ where: { id } });
    if (!existente) throw new NotFoundException('Cliente no encontrado.');

    const nombre = dto.nombre?.trim();
    if (nombre && existente.tipoPersona === 'FISICA' && !nombre.includes(',')) {
      throw new BadRequestException('Use formato Apellido, Nombre para persona física.');
    }

    try {
      const c = await this.prisma.cliente.update({
        where: { id },
        data: {
          ...(nombre ? { nombre } : {}),
          ...(dto.documento ? { documento: dto.documento.trim() } : {}),
          ...(dto.tipoDocumento ? { tipoDocumento: dto.tipoDocumento as never } : {}),
          ...(dto.tipoPersona ? { tipoPersona: dto.tipoPersona as never } : {}),
          ...(dto.email !== undefined ? { email: dto.email?.trim() || null } : {}),
          ...(dto.telefono !== undefined ? { telefono: dto.telefono?.trim() || null } : {}),
          ...(dto.domicilio !== undefined ? { domicilio: dto.domicilio?.trim() || null } : {}),
        },
      });
      return serializar(c);
    } catch (e: unknown) {
      if (typeof e === 'object' && e && 'code' in e && (e as { code: string }).code === 'P2002') {
        throw new ConflictException('Ya existe otro cliente con ese documento.');
      }
      throw new ServiceUnavailableException('No se pudo actualizar el cliente.');
    }
  }

  async eliminar(sesion: EstudioSession, id: string) {
    this.assertWrite(sesion);
    const asuntos = await this.prisma.asunto.count({ where: { clienteId: id } });
    if (asuntos > 0) {
      throw new ConflictException('No se puede eliminar: el cliente tiene asuntos asociados.');
    }
    try {
      await this.prisma.cliente.delete({ where: { id } });
      return { ok: true };
    } catch {
      throw new NotFoundException('Cliente no encontrado.');
    }
  }
}
