import type { Prisma } from '../../../generated/prisma-estudio';
import { CATEGORIAS_GASTO, ESTADOS_GASTO } from '@shared/types';
import { parseFechaGasto, paginacionFromQuery } from '@shared/utils';

export const gastoInclude = {
  cliente: { select: { id: true, nombre: true, documento: true } },
  asunto: { select: { id: true, ordinal: true, descripcion: true } },
  catalogoItem: { select: { id: true, nombre: true } },
} satisfies Prisma.GastoInclude;

export function construirWhereGastos(params: Record<string, string | undefined>): Prisma.GastoWhereInput {
  const where: Prisma.GastoWhereInput = {};
  const q = params.q?.trim();
  if (q) {
    where.OR = [
      { nombre: { contains: q, mode: 'insensitive' } },
      { descripcion: { contains: q, mode: 'insensitive' } },
      { oficinaPublica: { contains: q, mode: 'insensitive' } },
      { observaciones: { contains: q, mode: 'insensitive' } },
      { cliente: { nombre: { contains: q, mode: 'insensitive' } } },
    ];
  }

  if (params.clienteId) where.clienteId = params.clienteId;
  if (params.asuntoId) where.asuntoId = params.asuntoId;

  if (params.categoria && (CATEGORIAS_GASTO as string[]).includes(params.categoria)) {
    where.categoria = params.categoria as Prisma.EnumCategoriaGastoFilter['equals'];
  }

  const estado = params.estado;
  if (estado && (ESTADOS_GASTO as string[]).includes(estado)) {
    if (estado === 'VENCIDO') {
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
        { estado: { not: 'PAGO_REALIZADO' } },
        { fechaVencimiento: { lt: new Date() } },
      ];
    } else {
      where.estado = estado as Prisma.EnumEstadoGastoFilter['equals'];
    }
  }

  const fd = params.fechaDesde;
  const fh = params.fechaHasta;
  if (fd || fh) {
    where.fecha = {};
    const dDesde = fd ? parseFechaGasto(fd) : null;
    const dHasta = fh ? parseFechaGasto(fh) : null;
    if (dDesde) where.fecha.gte = dDesde;
    if (dHasta) {
      dHasta.setHours(23, 59, 59, 999);
      where.fecha.lte = dHasta;
    }
  }

  const vd = params.vencimientoDesde;
  const vh = params.vencimientoHasta;
  if (vd || vh) {
    where.fechaVencimiento = {};
    const dDesde = vd ? parseFechaGasto(vd) : null;
    const dHasta = vh ? parseFechaGasto(vh) : null;
    if (dDesde) where.fechaVencimiento.gte = dDesde;
    if (dHasta) {
      dHasta.setHours(23, 59, 59, 999);
      where.fechaVencimiento.lte = dHasta;
    }
  }

  return where;
}

export function parsePaginacionParams(params: Record<string, string | undefined>) {
  return paginacionFromQuery(params.page, params.pageSize);
}
