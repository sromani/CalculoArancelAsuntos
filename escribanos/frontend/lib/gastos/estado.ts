import type { EstadoGasto } from "@prisma/client";

/** Deriva estado efectivo según vencimiento y pago. */
export function estadoGastoEfectivo(
  estado: EstadoGasto,
  fechaVencimiento: Date | null,
  ahora = new Date()
): EstadoGasto {
  if (estado === "PAGO_REALIZADO") return "PAGO_REALIZADO";
  if (fechaVencimiento && fechaVencimiento < ahora) return "VENCIDO";
  return estado === "VENCIDO" ? "VENCIDO" : "PENDIENTE";
}

export function diasHastaVencimiento(fechaVencimiento: Date | null, ahora = new Date()): number | null {
  if (!fechaVencimiento) return null;
  const ms = fechaVencimiento.getTime() - ahora.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}
