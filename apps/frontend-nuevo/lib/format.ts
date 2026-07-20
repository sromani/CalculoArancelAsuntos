import type { CategoriaGasto, EstadoGasto, EstadoPresupuesto, MonedaGasto } from "@shared/types";
import { ETIQUETA_CATEGORIA, ETIQUETA_ESTADO_GASTO, ETIQUETA_ESTADO_PRESUPUESTO } from "@shared/types";

export function fmtMoney(n: number, moneda: MonedaGasto | string = "PESOS"): string {
  const fmt = new Intl.NumberFormat("es-UY", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n);
  if (moneda === "PESOS" || moneda === "UYU") return `$ ${fmt}`;
  return `${fmt} ${moneda}`;
}

export function fmtFecha(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-UY", { day: "2-digit", month: "short", year: "numeric" });
}

export function etiquetaEstadoGasto(e: EstadoGasto): string {
  return ETIQUETA_ESTADO_GASTO[e] ?? e;
}

export function etiquetaCategoria(c: CategoriaGasto): string {
  return ETIQUETA_CATEGORIA[c] ?? c;
}

export function etiquetaEstadoPresupuesto(e: EstadoPresupuesto): string {
  return ETIQUETA_ESTADO_PRESUPUESTO[e] ?? e;
}

export function claseEstadoGasto(e: EstadoGasto): string {
  if (e === "PAGO_REALIZADO") return "badge-success";
  if (e === "VENCIDO") return "badge-danger";
  return "badge-warning";
}

export function claseEstadoPresupuesto(e: EstadoPresupuesto): string {
  if (e === "ACEPTADO") return "badge-success";
  if (e === "RECHAZADO" || e === "ANULADO") return "badge-danger";
  if (e === "EMITIDO") return "badge-accent";
  return "badge-neutral";
}
