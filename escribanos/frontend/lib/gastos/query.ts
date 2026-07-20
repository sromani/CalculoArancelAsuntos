import type { Prisma } from "@prisma/client";
import { parseFechaGasto } from "./validaciones";
import { CATEGORIAS_GASTO, ESTADOS_GASTO } from "./types";

export const gastoInclude = {
  cliente: { select: { id: true, nombre: true, documento: true } },
  asunto: { select: { id: true, ordinal: true, descripcion: true } },
  catalogoItem: { select: { id: true, nombre: true } },
} satisfies Prisma.GastoInclude;

export function construirWhereGastos(searchParams: URLSearchParams): Prisma.GastoWhereInput {
  const where: Prisma.GastoWhereInput = {};
  const q = searchParams.get("q")?.trim();
  if (q) {
    where.OR = [
      { nombre: { contains: q, mode: "insensitive" } },
      { descripcion: { contains: q, mode: "insensitive" } },
      { oficinaPublica: { contains: q, mode: "insensitive" } },
      { observaciones: { contains: q, mode: "insensitive" } },
      { cliente: { nombre: { contains: q, mode: "insensitive" } } },
    ];
  }

  const clienteId = searchParams.get("clienteId");
  if (clienteId) where.clienteId = clienteId;

  const asuntoId = searchParams.get("asuntoId");
  if (asuntoId) where.asuntoId = asuntoId;

  const categoria = searchParams.get("categoria");
  if (categoria && (CATEGORIAS_GASTO as string[]).includes(categoria)) {
    where.categoria = categoria as Prisma.EnumCategoriaGastoFilter["equals"];
  }

  const estado = searchParams.get("estado");
  if (estado && (ESTADOS_GASTO as string[]).includes(estado)) {
    if (estado === "VENCIDO") {
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
        { estado: { not: "PAGO_REALIZADO" } },
        { fechaVencimiento: { lt: new Date() } },
      ];
    } else {
      where.estado = estado as Prisma.EnumEstadoGastoFilter["equals"];
    }
  }

  const fd = searchParams.get("fechaDesde");
  const fh = searchParams.get("fechaHasta");
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

  const vd = searchParams.get("vencimientoDesde");
  const vh = searchParams.get("vencimientoHasta");
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

export function parsePaginacion(searchParams: URLSearchParams): {
  page: number;
  pageSize: number;
  skip: number;
} {
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(100, Math.max(5, parseInt(searchParams.get("pageSize") ?? "20", 10) || 20));
  return { page, pageSize, skip: (page - 1) * pageSize };
}
