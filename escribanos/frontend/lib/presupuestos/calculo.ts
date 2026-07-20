import type { MonedaGasto } from "@prisma/client";
import type { MonedaEntrada, TasasLineas } from "@/lib/arancel/conversion";
import { calcularDesglosePresupuestoHonario, type LineasDesgloseLiquido } from "@/lib/arancel/liquido-escribano";

export function sumarGastosPesos(
  lineas: { importe: number; moneda: MonedaGasto; incluido: boolean }[]
): number {
  return lineas.reduce((acc, l) => {
    if (!l.incluido) return acc;
    if (l.moneda === "PESOS") return acc + l.importe;
    return acc;
  }, 0);
}

export function calcularTotalesPresupuesto(
  honorarioACobrar: number,
  honorarioArancel: number,
  moneda: MonedaEntrada,
  tasas: TasasLineas,
  fonasaPct: number,
  irpfPct: number,
  gastosLineas: { importe: number; moneda: MonedaGasto; incluido: boolean }[]
): {
  desgloseArancel: LineasDesgloseLiquido;
  desglosePresupuesto: LineasDesgloseLiquido;
  totalGastos: number;
  totalPresupuesto: number;
} | null {
  const desglose = calcularDesglosePresupuestoHonario(
    honorarioArancel,
    honorarioACobrar,
    moneda,
    tasas,
    fonasaPct,
    irpfPct
  );
  if (!desglose) return null;

  const totalGastos = sumarGastosPesos(gastosLineas);
  const totalPresupuesto =
    desglose.lineasPresupuesto.totalFactura + totalGastos;

  return {
    desgloseArancel: desglose.lineasArancel,
    desglosePresupuesto: desglose.lineasPresupuesto,
    totalGastos,
    totalPresupuesto,
  };
}
