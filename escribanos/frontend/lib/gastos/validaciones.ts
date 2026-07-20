import type { Prisma } from "@prisma/client";
import type { CategoriaGasto, EstadoGasto, MonedaGasto } from "@prisma/client";
import { CATEGORIAS_GASTO, ESTADOS_GASTO, type GastoInput, type GastoRow } from "./types";
import { estadoGastoEfectivo } from "./estado";

const MONEDAS: MonedaGasto[] = ["PESOS", "DOLARES", "UR", "UI"];

export function parseFechaGasto(raw: string): Date | null {
  if (!raw || typeof raw !== "string") return null;
  const d = new Date(raw.includes("T") ? raw : `${raw}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function strOrNull(v: unknown): string | null {
  if (v == null || v === "") return null;
  return String(v).trim() || null;
}

function esEnum<T extends string>(v: unknown, opts: readonly T[]): v is T {
  return typeof v === "string" && (opts as readonly string[]).includes(v);
}

export function validarGastoInput(
  body: Record<string, unknown>
): { ok: true; data: GastoInput } | { ok: false; error: string } {
  const nombre = strOrNull(body.nombre);
  if (!nombre) return { ok: false, error: "El nombre es obligatorio." };

  if (!esEnum(body.categoria, CATEGORIAS_GASTO)) {
    return { ok: false, error: "Categoría inválida." };
  }

  const fecha = typeof body.fecha === "string" ? body.fecha : "";
  if (!parseFechaGasto(fecha)) return { ok: false, error: "Fecha inválida." };

  const importe = Number(body.importe);
  if (!Number.isFinite(importe) || importe < 0) {
    return { ok: false, error: "Importe inválido." };
  }

  if (!esEnum(body.moneda, MONEDAS)) {
    return { ok: false, error: "Moneda inválida." };
  }

  const estadoRaw = body.estado;
  const estado =
    estadoRaw == null || estadoRaw === ""
      ? "PENDIENTE"
      : esEnum(estadoRaw, ESTADOS_GASTO)
        ? estadoRaw
        : null;
  if (!estado) return { ok: false, error: "Estado inválido." };

  const fv = body.fechaVencimiento;
  const fechaVencimiento =
    fv == null || fv === "" ? null : typeof fv === "string" ? fv : null;
  if (fechaVencimiento && !parseFechaGasto(fechaVencimiento)) {
    return { ok: false, error: "Fecha de vencimiento inválida." };
  }

  return {
    ok: true,
    data: {
      nombre,
      categoria: body.categoria as CategoriaGasto,
      oficinaPublica: strOrNull(body.oficinaPublica),
      descripcion: strOrNull(body.descripcion),
      fecha,
      fechaVencimiento,
      importe,
      moneda: body.moneda as MonedaGasto,
      estado,
      observaciones: strOrNull(body.observaciones),
      catalogoItemId: strOrNull(body.catalogoItemId),
      clienteId: strOrNull(body.clienteId),
      asuntoId: strOrNull(body.asuntoId),
    },
  };
}

type GastoConRelaciones = Prisma.GastoGetPayload<{
  include: {
    cliente: { select: { id: true; nombre: true; documento: true } };
    asunto: { select: { id: true; ordinal: true; descripcion: true } };
    catalogoItem: { select: { id: true; nombre: true } };
  };
}>;

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
