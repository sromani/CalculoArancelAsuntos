import type { Prisma } from '../../../generated/prisma-estudio';
import type { GastoRow } from '@shared/types';
import { estadoGastoEfectivo } from '@shared/utils';
import { gastoInclude } from './gastos-query';

type GastoConRelaciones = Prisma.GastoGetPayload<{ include: typeof gastoInclude }>;

export function serializarGasto(g: GastoConRelaciones): GastoRow {
  const estado = estadoGastoEfectivo(g.estado, g.fechaVencimiento);
  return {
    id: g.id,
    nombre: g.nombre,
    categoria: g.categoria,
    oficinaPublica: g.oficinaPublica,
    descripcion: g.descripcion,
    fecha: g.fecha.toISOString(),
    fechaVencimiento: g.fechaVencimiento?.toISOString() ?? null,
    importe: g.importe,
    moneda: g.moneda,
    estado,
    observaciones: g.observaciones,
    comprobantePath: g.comprobantePath,
    catalogoItemId: g.catalogoItemId,
    clienteId: g.clienteId,
    asuntoId: g.asuntoId,
    createdAt: g.createdAt.toISOString(),
    updatedAt: g.updatedAt.toISOString(),
    cliente: g.cliente,
    asunto: g.asunto,
    catalogoItem: g.catalogoItem,
  };
}
