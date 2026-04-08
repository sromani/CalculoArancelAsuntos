import type { MonedaEntrada, TasasLineas } from "./conversion";
import {
  ETIQUETA_MONEDA,
  honorarioPrincipalHaciaArriba,
  montoPrincipalAPesos,
  pesosAMontoPrincipal,
  sinMenosCero,
} from "./conversion";
import type { ResultadoCalculo } from "./compute";

/** Parseo de números con coma decimal (es-UY). */
export function parseNumEsUy(raw: string): number | null {
  const t = raw.trim().replace(/\s/g, "").replace(",", ".");
  if (t === "") return null;
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

/**
 * Campo «honorarios a cobrar»: coma decimal; punto(s) como separador de miles (ej. 3.000 → 3000, 1.234,5 → 1234,5).
 */
export function parseHonorarioACobrarInput(raw: string): number | null {
  const t = raw.trim().replace(/\s/g, "");
  if (t === "") return null;

  if (t.includes(",")) {
    const lastComma = t.lastIndexOf(",");
    const intPart = t.slice(0, lastComma).replace(/\./g, "");
    const decPart = t.slice(lastComma + 1).replace(/[^\d]/g, "");
    if (intPart === "" && decPart === "") return null;
    const intN = intPart === "" ? "0" : intPart;
    const n = decPart === "" ? Number(intN) : Number(`${intN}.${decPart}`);
    if (!Number.isFinite(n) || n < 0) return null;
    return n;
  }

  if (!t.includes(".")) {
    const n = Number(t);
    if (!Number.isFinite(n) || n < 0) return null;
    return n;
  }

  const parts = t.split(".");
  const last = parts[parts.length - 1] ?? "";
  if (last.length <= 2 && /^\d*$/.test(last)) {
    const n = Number(t);
    if (!Number.isFinite(n) || n < 0) return null;
    return n;
  }

  const joined = parts.join("");
  const n = Number(joined);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

/**
 * Tramos fondo gremial (honorario en UR semestral → aporte en UR semestral).
 * Fuente: escribanos/documents/fondogremial.csv
 */
const TRAMOS_FONDO_GREMIAL: { hasta: number; fgUr: number }[] = [
  { hasta: 5, fgUr: 0 },
  { hasta: 10, fgUr: 0.1 },
  { hasta: 20, fgUr: 0.25 },
  { hasta: 40, fgUr: 0.5 },
  { hasta: 80, fgUr: 0.75 },
  { hasta: 160, fgUr: 1.25 },
  { hasta: Infinity, fgUr: 2 },
];

export function fondoGremialUrSemestral(honorarioUrSemestral: number): number {
  const ur = Math.max(0, honorarioUrSemestral);
  for (const t of TRAMOS_FONDO_GREMIAL) {
    if (ur <= t.hasta) return t.fgUr;
  }
  return TRAMOS_FONDO_GREMIAL[TRAMOS_FONDO_GREMIAL.length - 1].fgUr;
}

export function honorarioEnPesos(resultado: ResultadoCalculo): number {
  return resultado.tipo === "porcentaje" ? resultado.montoPesos : resultado.honorarioPesos;
}

export function honorarioEnPrincipal(resultado: ResultadoCalculo, tasas: TasasLineas): number {
  const p = pesosAMontoPrincipal(honorarioEnPesos(resultado), resultado.monedaPrincipal, tasas);
  return honorarioPrincipalHaciaArriba(p);
}

/** Todo monto del desglose en moneda de visualización: entero hacia arriba. */
function montoDisplayEnteroArriba(n: number): number {
  if (!Number.isFinite(n)) return 0;
  if (n === 0) return 0;
  if (Math.abs(n) < 1e-9) return 0;
  const c = Math.ceil(n - 1e-9);
  return sinMenosCero(c);
}

function formatMoneyEntero(n: number): string {
  const r = sinMenosCero(Math.round(n));
  return new Intl.NumberFormat("es-UY", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(r);
}

function redondearLineasDesglose(l: LineasDesgloseLiquido): LineasDesgloseLiquido {
  const rv = (x: number) => montoDisplayEnteroArriba(x);
  const honorario = l.honorario;
  const montepio = rv(l.montepio);
  const fondoGremial = rv(l.fondoGremial);
  const fondoReconversionLaboral = rv(l.fondoReconversionLaboral);
  const totalAportes = rv(montepio + fondoGremial + fondoReconversionLaboral);
  const iva = rv(l.iva);
  const totalFactura = rv(honorario + iva);
  const fonasa = rv(l.fonasa);
  const irpf = rv(l.irpf);
  const totalGastos = rv(fonasa + irpf);
  const liquido = rv(honorario - totalAportes - totalGastos);
  const baseIrpf = rv(l.baseIrpf);
  return {
    honorario,
    iva,
    totalFactura,
    montepio,
    fondoGremial,
    fondoReconversionLaboral,
    totalAportes,
    fonasa,
    baseIrpf,
    irpf,
    totalGastos,
    liquido,
  };
}

export function formatearMontoEnMoneda(n: number, moneda: MonedaEntrada): string {
  const r = montoDisplayEnteroArriba(n);
  if (moneda === "UYU") {
    return `$ ${formatMoneyEntero(r)}`;
  }
  return `${formatMoneyEntero(r)} ${ETIQUETA_MONEDA[moneda]}`;
}

export type LineasDesgloseLiquido = {
  honorario: number;
  iva: number;
  totalFactura: number;
  montepio: number;
  fondoGremial: number;
  fondoReconversionLaboral: number;
  totalAportes: number;
  fonasa: number;
  baseIrpf: number;
  irpf: number;
  totalGastos: number;
  liquido: number;
};

/**
 * honorario: en moneda de visualización (se redondea hacia arriba a entero).
 */
export function calcularDesgloseLiquido(
  honorario: number,
  moneda: MonedaEntrada,
  tasas: TasasLineas,
  fonasaPct: number,
  irpfPct: number
): LineasDesgloseLiquido | null {
  const h = honorarioPrincipalHaciaArriba(honorario);
  if (!Number.isFinite(h) || h < 0) return null;

  const honorPesos = montoPrincipalAPesos(h, moneda, tasas);
  const urHonor = tasas.urSemestralPesos > 0 ? honorPesos / tasas.urSemestralPesos : 0;
  const fgUr = fondoGremialUrSemestral(urHonor);
  const fgPesos = fgUr * tasas.urSemestralPesos;
  const fondoGremial = pesosAMontoPrincipal(fgPesos, moneda, tasas);

  const fondoReconversionLaboral = 0;

  const montepio = h * 0.19;
  const iva = h * 0.22;
  const totalFactura = h + iva;
  const totalAportes = montepio + fondoGremial + fondoReconversionLaboral;

  const base70 = h * 0.7;
  const fonasa = (fonasaPct / 100) * base70;

  const baseIrpfBruta =
    0.7 * (h - montepio - fondoGremial - fondoReconversionLaboral) + montepio;
  const baseIrpf = Math.max(0, baseIrpfBruta);
  const irpf = (irpfPct / 100) * baseIrpf;
  const totalGastos = fonasa + irpf;
  const liquido = h - totalAportes - totalGastos;

  return redondearLineasDesglose({
    honorario: h,
    iva,
    totalFactura,
    montepio,
    fondoGremial,
    fondoReconversionLaboral,
    totalAportes,
    fonasa,
    baseIrpf,
    irpf,
    totalGastos,
    liquido,
  });
}

export type AportesArancelParaAlternativo = Pick<
  LineasDesgloseLiquido,
  "montepio" | "fondoGremial" | "fondoReconversionLaboral" | "totalAportes"
>;

/** Segunda columna: mismos aportes que `aportesArancel`; factura y gastos según honorario alternativo. */
export function calcularDesgloseLiquidoConAportesArancel(
  honorarioFacturacion: number,
  aportesArancel: AportesArancelParaAlternativo,
  moneda: MonedaEntrada,
  tasas: TasasLineas,
  fonasaPct: number,
  irpfPct: number
): LineasDesgloseLiquido | null {
  const h = honorarioPrincipalHaciaArriba(honorarioFacturacion);
  if (!Number.isFinite(h) || h < 0) return null;

  const { montepio, fondoGremial, fondoReconversionLaboral, totalAportes } = aportesArancel;

  const iva = h * 0.22;
  const totalFactura = h + iva;

  const base70 = h * 0.7;
  const fonasa = (fonasaPct / 100) * base70;

  const baseIrpfBruta =
    0.7 * (h - montepio - fondoGremial - fondoReconversionLaboral) + montepio;
  const baseIrpf = Math.max(0, baseIrpfBruta);
  const irpf = (irpfPct / 100) * baseIrpf;
  const totalGastos = fonasa + irpf;
  const liquido = h - totalAportes - totalGastos;

  return redondearLineasDesglose({
    honorario: h,
    iva,
    totalFactura,
    montepio,
    fondoGremial,
    fondoReconversionLaboral,
    totalAportes,
    fonasa,
    baseIrpf,
    irpf,
    totalGastos,
    liquido,
  });
}
