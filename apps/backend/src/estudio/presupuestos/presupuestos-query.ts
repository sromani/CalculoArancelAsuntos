import type { Prisma } from '../../../generated/prisma-estudio';
import { ESTADOS_PRESUPUESTO } from '@shared/types';

export const presupuestoInclude = {
  cliente: { select: { id: true, nombre: true, documento: true } },
  asunto: { select: { id: true, ordinal: true, descripcion: true } },
  lineasGastos: {
    orderBy: { orden: 'asc' as const },
    include: {
      gasto: {
        select: {
          id: true,
          nombre: true,
          categoria: true,
          oficinaPublica: true,
          estado: true,
        },
      },
    },
  },
} satisfies Prisma.PresupuestoNotarialInclude;

type PresupuestoDb = Prisma.PresupuestoNotarialGetPayload<{ include: typeof presupuestoInclude }>;

export function serializarPresupuesto(p: PresupuestoDb) {
  return {
    id: p.id,
    numero: p.numero,
    clienteId: p.clienteId,
    asuntoId: p.asuntoId,
    estado: p.estado,
    titulo: p.titulo,
    honorarioArancel: p.honorarioArancel,
    honorarioACobrar: p.honorarioACobrar,
    totalGastos: p.totalGastos,
    totalPresupuesto: p.totalPresupuesto,
    notas: p.notas,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    cliente: p.cliente,
    asunto: p.asunto,
    lineasGastos: p.lineasGastos.map((l) => ({
      id: l.id,
      gastoId: l.gastoId,
      importe: l.importe,
      moneda: l.moneda,
      incluido: l.incluido,
      gasto: l.gasto,
    })),
  };
}

export function construirWherePresupuestos(params: Record<string, string | undefined>): Prisma.PresupuestoNotarialWhereInput {
  const where: Prisma.PresupuestoNotarialWhereInput = {};
  const q = params.q?.trim();
  if (q) {
    where.OR = [
      { titulo: { contains: q, mode: 'insensitive' } },
      { actoDescripcion: { contains: q, mode: 'insensitive' } },
      { cliente: { nombre: { contains: q, mode: 'insensitive' } } },
    ];
  }
  if (params.clienteId) where.clienteId = params.clienteId;
  if (params.estado && (ESTADOS_PRESUPUESTO as string[]).includes(params.estado)) {
    where.estado = params.estado as Prisma.EnumEstadoPresupuestoFilter['equals'];
  }
  return where;
}
