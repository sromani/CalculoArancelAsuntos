import type { Prisma } from "@prisma/client";
import type { LineasDesgloseLiquido } from "@/lib/arancel/liquido-escribano";
import { ESTADOS_PRESUPUESTO, type PresupuestoInput, type PresupuestoRow } from "./types";

function strOrNull(v: unknown): string | null {
  if (v == null || v === "") return null;
  return String(v).trim() || null;
}

function numOr(v: unknown, def: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

export function validarPresupuestoInput(
  body: Record<string, unknown>
): { ok: true; data: PresupuestoInput } | { ok: false; error: string } {
  const clienteId = strOrNull(body.clienteId);
  if (!clienteId) return { ok: false, error: "Cliente obligatorio." };

  const estadoRaw = body.estado;
  const estado =
    estadoRaw == null || estadoRaw === ""
      ? "BORRADOR"
      : typeof estadoRaw === "string" && (ESTADOS_PRESUPUESTO as string[]).includes(estadoRaw)
        ? (estadoRaw as PresupuestoInput["estado"])
        : null;
  if (!estado) return { ok: false, error: "Estado inválido." };

  const gastoIds = Array.isArray(body.gastoIds)
    ? body.gastoIds.filter((x): x is string => typeof x === "string")
    : undefined;

  return {
    ok: true,
    data: {
      clienteId,
      asuntoId: strOrNull(body.asuntoId),
      titulo: strOrNull(body.titulo),
      estado,
      actoCapituloId: strOrNull(body.actoCapituloId),
      actoPosDoc: body.actoPosDoc != null ? numOr(body.actoPosDoc, 0) : null,
      actoPosBien: body.actoPosBien != null ? numOr(body.actoPosBien, 0) : null,
      actoDescripcion: strOrNull(body.actoDescripcion),
      actoSnapshot: body.actoSnapshot ?? null,
      monedaHonorario: strOrNull(body.monedaHonorario) ?? "UYU",
      honorarioArancel: numOr(body.honorarioArancel, 0),
      honorarioACobrar: numOr(body.honorarioACobrar, 0),
      fonasaPct: numOr(body.fonasaPct, 6),
      irpfPct: numOr(body.irpfPct, 15),
      desgloseArancel: (body.desgloseArancel as LineasDesgloseLiquido) ?? null,
      desglosePresupuesto: (body.desglosePresupuesto as LineasDesgloseLiquido) ?? null,
      fechaCotizacion: strOrNull(body.fechaCotizacion),
      cotizacionesSnapshot: body.cotizacionesSnapshot ?? null,
      notas: strOrNull(body.notas),
      gastoIds,
    },
  };
}

export const presupuestoInclude = {
  cliente: { select: { id: true, nombre: true, documento: true } },
  asunto: { select: { id: true, ordinal: true, descripcion: true } },
  lineasGastos: {
    orderBy: { orden: "asc" as const },
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

export function serializarPresupuesto(p: PresupuestoDb): PresupuestoRow {
  return {
    id: p.id,
    numero: p.numero,
    clienteId: p.clienteId,
    asuntoId: p.asuntoId,
    estado: p.estado,
    titulo: p.titulo,
    actoCapituloId: p.actoCapituloId,
    actoPosDoc: p.actoPosDoc,
    actoPosBien: p.actoPosBien,
    actoDescripcion: p.actoDescripcion,
    actoSnapshot: p.actoSnapshot,
    monedaHonorario: p.monedaHonorario,
    honorarioArancel: p.honorarioArancel,
    honorarioACobrar: p.honorarioACobrar,
    fonasaPct: p.fonasaPct,
    irpfPct: p.irpfPct,
    desgloseArancel: p.desgloseArancel as LineasDesgloseLiquido | null,
    desglosePresupuesto: p.desglosePresupuesto as LineasDesgloseLiquido | null,
    totalGastos: p.totalGastos,
    totalPresupuesto: p.totalPresupuesto,
    fechaCotizacion: p.fechaCotizacion?.toISOString() ?? null,
    cotizacionesSnapshot: p.cotizacionesSnapshot,
    notas: p.notas,
    duplicadoDeId: p.duplicadoDeId,
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
      orden: l.orden,
      gasto: l.gasto,
    })),
  };
}

export function construirWherePresupuestos(searchParams: URLSearchParams): Prisma.PresupuestoNotarialWhereInput {
  const where: Prisma.PresupuestoNotarialWhereInput = {};
  const q = searchParams.get("q")?.trim();
  if (q) {
    where.OR = [
      { titulo: { contains: q, mode: "insensitive" } },
      { actoDescripcion: { contains: q, mode: "insensitive" } },
      { cliente: { nombre: { contains: q, mode: "insensitive" } } },
    ];
  }
  const clienteId = searchParams.get("clienteId");
  if (clienteId) where.clienteId = clienteId;
  const asuntoId = searchParams.get("asuntoId");
  if (asuntoId) where.asuntoId = asuntoId;
  const estado = searchParams.get("estado");
  if (estado && (ESTADOS_PRESUPUESTO as string[]).includes(estado)) {
    where.estado = estado as Prisma.EnumEstadoPresupuestoFilter["equals"];
  }
  return where;
}
