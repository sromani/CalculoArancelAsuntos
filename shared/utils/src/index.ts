/** Parseo de fechas ISO o YYYY-MM-DD para gastos. */
export function parseFechaGasto(raw: string): Date | null {
  if (!raw || typeof raw !== "string") return null;
  const d = new Date(raw.includes("T") ? raw : `${raw}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function estadoGastoEfectivo(
  estado: string,
  fechaVencimiento: Date | null | undefined,
  now = new Date()
): "PENDIENTE" | "PAGO_REALIZADO" | "VENCIDO" {
  if (estado === "PAGO_REALIZADO") return "PAGO_REALIZADO";
  if (fechaVencimiento && fechaVencimiento < now) return "VENCIDO";
  return estado === "VENCIDO" ? "VENCIDO" : "PENDIENTE";
}

export function paginacionFromQuery(
  pageRaw?: string | number | null,
  pageSizeRaw?: string | number | null,
  maxPageSize = 100
): { page: number; pageSize: number; skip: number } {
  const page = Math.max(1, Number(pageRaw) || 1);
  const pageSize = Math.min(maxPageSize, Math.max(1, Number(pageSizeRaw) || 20));
  return { page, pageSize, skip: (page - 1) * pageSize };
}
