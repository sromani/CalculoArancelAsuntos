import type { MonedaEntrada, TasasLineas } from "./conversion";
import {
  ETIQUETA_MONEDA,
  formatoHonorarioEntero,
  honorarioPesosDesdePrincipalEntero,
  honorarioPrincipalRedondeadoDesdePesosBrutos,
  montoPrincipalAPesos,
} from "./conversion";
import type { DetalleSpec, HonorarioParsed, Regla } from "./types";
import usufructoData from "./usufructo-coefs.json";

const COEF_USUFRUCTO: number[] = (usufructoData as { coefs: number[] }).coefs;

export type ValoresForm = Record<string, string>;

export type ResultadoCalculo =
  | {
      tipo: "ur_fijo";
      ur: number;
      periodo?: string;
      textoHonorario: string;
      articulo: string;
      honorarioPesos: number;
      honorarioPesosFormateado: string;
      honorarioPrincipalFormateado: string;
      monedaPrincipal: MonedaEntrada;
    }
  | {
      tipo: "porcentaje";
      porcentaje: number;
      porcentajeTexto: string;
      basePesos: number;
      baseDescripcion: string;
      montoPesos: number;
      montoPesosFormateado: string;
      montoPrincipalFormateado: string;
      monedaPrincipal: MonedaEntrada;
      articulo: string;
    }
  | {
      tipo: "monto_simple";
      articulo: string;
      honorarioPesos: number;
      honorarioPesosFormateado: string;
      honorarioPrincipalFormateado: string;
      monedaPrincipal: MonedaEntrada;
      formulaDescripcion: string;
    };

export type ContextoCalculo = {
  monedaPrincipal: MonedaEntrada;
  tasas: TasasLineas;
};

function parseNum(raw: string): number | null {
  const t = raw.trim().replace(/\s/g, "").replace(",", ".");
  if (t === "") return null;
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

function formatMoney(n: number): string {
  return new Intl.NumberFormat("es-UY", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
}

function formatHonorarioPesosMostrar(n: number): string {
  return new Intl.NumberFormat("es-UY", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(n));
}

function formatCoeficiente(n: number): string {
  return new Intl.NumberFormat("es-UY", { maximumFractionDigits: 6 }).format(n);
}

export function resolverClaveRegla(
  posDoc: number,
  posBien: number | null,
  tieneSeleccionBien: boolean
): string | null {
  if (tieneSeleccionBien) {
    if (posBien == null) return null;
    return `${posDoc}-${posBien}`;
  }
  return `${posDoc}`;
}

function coeficienteNuda(anios: number): number | null {
  const n = Math.min(70, Math.max(1, Math.round(anios)));
  const k = COEF_USUFRUCTO[n - 1];
  return k != null && Number.isFinite(k) ? k : null;
}

function plazoUsufructoAnios(valores: ValoresForm): { ok: true; anios: number } | { ok: false; mensaje: string } {
  const tipo = valores.usufructoTipoPlazo?.trim();
  if (tipo !== "contractual" && tipo !== "vitalicio") {
    return { ok: false, mensaje: "Indicá si el plazo es contractual o vitalicio." };
  }
  if (tipo === "contractual") {
    const a = parseInt(valores.usufructoAniosContrato ?? "", 10);
    if (!Number.isFinite(a) || a < 1 || a > 70) {
      return { ok: false, mensaje: "El plazo contractual debe estar entre 1 y 70 años." };
    }
    return { ok: true, anios: a };
  }
  const edad = parseInt(valores.usufructoEdadMenor ?? "", 10);
  if (!Number.isFinite(edad) || edad < 0 || edad > 120) {
    return { ok: false, mensaje: "Ingresá la edad del menor de los usufructuarios (0–120)." };
  }
  const anios = Math.min(70, Math.max(3, 70 - edad));
  return { ok: true, anios };
}

/**
 * @param principalAPesos Convierte montos de “valor partes / capital / etc.” a pesos. Catastral siempre en pesos.
 */
export function calcularValorBase(
  spec: DetalleSpec,
  valores: ValoresForm,
  principalAPesos: (montoPrincipal: number) => number,
  regla?: Pick<Regla, "tablaUsufructo">
): { ok: true; basePesos: number; descripcion: string } | { ok: false; mensaje: string } {
  const tu = regla?.tablaUsufructo;

  if (spec.kind === "max_partes_catastral" && tu && (tu === "usufructo" || tu === "uso")) {
    const pl = plazoUsufructoAnios(valores);
    if (!pl.ok) return pl;
    const vpRaw = parseNum(valores.valorPartes ?? "");
    const vcRaw = parseNum(valores.valorCatastral ?? "");
    const vpPesos = vpRaw != null ? principalAPesos(vpRaw) : null;
    const vcPesos = vcRaw != null ? vcRaw : null;
    if (vpPesos == null && vcPesos == null) {
      return {
        ok: false,
        mensaje: "Ingresá el valor asignado por las partes y/o el valor real total del inmueble (catastral u oficial) en pesos.",
      };
    }
    /** Valor total del bien para la tabla: el mayor entre partes (en $) y catastral/oficial (en $), como en el apartado sobre base del inmueble. */
    const vt = Math.max(vpPesos ?? 0, vcPesos ?? 0);
    const K = coeficienteNuda(pl.anios);
    if (K == null) {
      return { ok: false, mensaje: "No hay coeficiente de tabla para el plazo indicado." };
    }
    const valorNuda = vt * K;
    const valorUsufructo = vt - valorNuda;
    const proporcionalOficial = tu === "uso" ? 0.5 * valorUsufructo : valorUsufructo;
    /** El porcentaje del arancel se aplica solo sobre el valor proporcional del usufructo (o del uso), no sobre el valor de partes ni el total del bien. */
    const basePesos = proporcionalOficial;
    const descripcion = `literal L — valor total del bien para la tabla (mayor partes/catastral): $ ${formatMoney(
      vt
    )} (partes $ ${formatMoney(vpPesos ?? 0)}, catastral/real $ ${formatMoney(
      vcPesos ?? 0
    )}). Plazo ${pl.anios} años, coef. nuda ${formatCoeficiente(K)}: nuda $ ${formatMoney(
      valorNuda
    )}, usufructo $ ${formatMoney(
      valorUsufructo
    )}. Base del honorario (${tu === "uso" ? "uso (50% del usufructo)" : "usufructo"}): $ ${formatMoney(
      basePesos
    )}.`;
    return { ok: true, basePesos, descripcion };
  }

  switch (spec.kind) {
    case "max_partes_catastral": {
      const vpRaw = parseNum(valores.valorPartes ?? "");
      const vcRaw = parseNum(valores.valorCatastral ?? "");
      if (vpRaw == null && vcRaw == null) {
        return { ok: false, mensaje: "Ingresá el valor asignado por las partes y/o el valor catastral." };
      }
      const vpPesos = vpRaw != null ? principalAPesos(vpRaw) : null;
      const vcPesos = vcRaw != null ? vcRaw : null;
      if (vpPesos != null && vcPesos != null) {
        const basePesos = Math.max(vpPesos, vcPesos);
        return {
          ok: true,
          basePesos,
          descripcion: `máximo entre valor de partes (${formatMoney(vpPesos)} $) y valor catastral (${formatMoney(vcPesos)} $)`,
        };
      }
      const basePesos = (vpPesos ?? vcPesos) as number;
      return {
        ok: true,
        basePesos,
        descripcion:
          vpPesos != null
            ? `valor asignado por las partes (${formatMoney(basePesos)} $)`
            : `valor catastral (${formatMoney(basePesos)} $)`,
      };
    }
    case "solo_partes": {
      const v = parseNum(valores.valorPartes ?? "");
      if (v == null) {
        return { ok: false, mensaje: "Ingresá el valor asignado por las partes." };
      }
      const pesos = principalAPesos(v);
      return {
        ok: true,
        basePesos: pesos,
        descripcion: `valor asignado por las partes (${formatMoney(pesos)} $)`,
      };
    }
    case "capital_social": {
      const v = parseNum(valores.capitalSocial ?? "");
      if (v == null) {
        return { ok: false, mensaje: "Ingresá el capital social." };
      }
      const pesos = principalAPesos(v);
      return { ok: true, basePesos: pesos, descripcion: `capital social (${formatMoney(pesos)} $)` };
    }
    case "aumento_capital": {
      const v = parseNum(valores.aumentoCapital ?? "");
      if (v == null) {
        return { ok: false, mensaje: "Ingresá el aumento de capital." };
      }
      const pesos = principalAPesos(v);
      return { ok: true, basePesos: pesos, descripcion: `aumento de capital (${formatMoney(pesos)} $)` };
    }
    case "aumento_precio": {
      const v = parseNum(valores.aumentoPrecio ?? "");
      if (v == null) {
        return { ok: false, mensaje: "Ingresá el aumento de precio." };
      }
      const pesos = principalAPesos(v);
      return { ok: true, basePesos: pesos, descripcion: `aumento de precio (${formatMoney(pesos)} $)` };
    }
    case "importe_pagos_periodicos": {
      const v = parseNum(valores.importePagos ?? "");
      if (v == null) {
        return { ok: false, mensaje: "Ingresá el importe total de pagos periódicos (según plazo convenido)." };
      }
      const pesos = principalAPesos(v);
      return {
        ok: true,
        basePesos: pesos,
        descripcion: `importe de pagos periódicos (${formatMoney(pesos)} $)`,
      };
    }
    case "generico": {
      const v = parseNum(valores.valorGenerico ?? "");
      if (v == null) {
        return { ok: false, mensaje: "Ingresá el valor indicado en la norma." };
      }
      const pesos = principalAPesos(v);
      return { ok: true, basePesos: pesos, descripcion: `valor ingresado (${formatMoney(pesos)} $)` };
    }
    case "testimonio_fojas":
      return { ok: false, mensaje: "Use el flujo de honorario directo para testimonios." };
    case "sin_detalle_pct":
      return { ok: false, mensaje: "Falta detalle de valor base en los datos. Contactá al administrador." };
    case "fijo_sin_entrada":
      return { ok: false, mensaje: "No corresponde valor base para este ítem." };
  }
  return { ok: false, mensaje: "Tipo de detalle no soportado." };
}

function honorarioMontoSimple(
  articulo: string,
  honorarioPesosBruto: number,
  monedaPrincipal: MonedaEntrada,
  tasas: TasasLineas,
  formulaDescripcion: string
): ResultadoCalculo {
  const principalRd = honorarioPrincipalRedondeadoDesdePesosBrutos(
    honorarioPesosBruto,
    monedaPrincipal,
    tasas
  );
  const honorarioPesos = honorarioPesosDesdePrincipalEntero(principalRd, monedaPrincipal, tasas);
  return {
    tipo: "monto_simple",
    articulo,
    honorarioPesos,
    honorarioPesosFormateado: formatHonorarioPesosMostrar(honorarioPesos),
    honorarioPrincipalFormateado: `${formatoHonorarioEntero(principalRd)} ${ETIQUETA_MONEDA[monedaPrincipal]}`,
    monedaPrincipal,
    formulaDescripcion,
  };
}

export function calcularHonorario(
  regla: Regla | undefined,
  valores: ValoresForm,
  ctx: ContextoCalculo
): ResultadoCalculo | { error: string } {
  if (!regla) {
    return { error: "No se encontró la combinación capítulo / documento / bien." };
  }

  const hp = regla.honorarioParsed as HonorarioParsed;
  const { monedaPrincipal, tasas } = ctx;
  const principalAPesos = (n: number) => montoPrincipalAPesos(n, monedaPrincipal, tasas);

  if (hp.tipo === "ur_fijo") {
    const urEfectivo = hp.maxUr != null ? Math.min(hp.ur, hp.maxUr) : hp.ur;
    const honorarioPesosBruto = urEfectivo * tasas.urSemestralPesos;
    const principalRd = honorarioPrincipalRedondeadoDesdePesosBrutos(
      honorarioPesosBruto,
      monedaPrincipal,
      tasas
    );
    const honorarioPesos = honorarioPesosDesdePrincipalEntero(principalRd, monedaPrincipal, tasas);
    return {
      tipo: "ur_fijo",
      ur: urEfectivo,
      periodo: hp.periodo,
      textoHonorario: hp.raw,
      articulo: regla.articulo,
      honorarioPesos,
      honorarioPesosFormateado: formatHonorarioPesosMostrar(honorarioPesos),
      honorarioPrincipalFormateado: `${formatoHonorarioEntero(principalRd)} ${ETIQUETA_MONEDA[monedaPrincipal]}`,
      monedaPrincipal,
    };
  }

  if (hp.tipo === "por_mil_con_min_ur") {
    const baseR = calcularValorBase(regla.detalleSpec, valores, principalAPesos, regla);
    if (!baseR.ok) return { error: baseR.mensaje };
    const porMil = hp.porMil / 1000;
    const porMonto = baseR.basePesos * porMil;
    const minPesos = hp.minUr * tasas.urSemestralPesos;
    const honorarioPesos = Math.max(porMonto, minPesos);
    const formulaDescripcion = `${hp.porMil}‰ sobre ${baseR.descripcion}; mínimo ${hp.minUr} UR semestral.`;
    return honorarioMontoSimple(regla.articulo, honorarioPesos, monedaPrincipal, tasas, formulaDescripcion);
  }

  if (hp.tipo === "por_mil_con_max_ur") {
    const baseR = calcularValorBase(regla.detalleSpec, valores, principalAPesos, regla);
    if (!baseR.ok) return { error: baseR.mensaje };
    const porMil = hp.porMil / 1000;
    const porMonto = baseR.basePesos * porMil;
    const maxPesos = hp.maxUr * tasas.urSemestralPesos;
    const honorarioPesos = Math.min(porMonto, maxPesos);
    const formulaDescripcion = `${hp.porMil}‰ sobre ${baseR.descripcion}; tope ${hp.maxUr} UR semestral.`;
    return honorarioMontoSimple(regla.articulo, honorarioPesos, monedaPrincipal, tasas, formulaDescripcion);
  }

  if (hp.tipo === "ur_por_fojas") {
    const fojas = parseInt(valores.numeroFojas ?? "", 10);
    if (!Number.isFinite(fojas) || fojas < 1) {
      return { error: "Ingresá el número de fojas (entero mayor o igual a 1)." };
    }
    let urTotal = hp.urPlana;
    if (fojas > hp.fojasIncluidas) {
      urTotal += (fojas - hp.fojasIncluidas) * hp.urPorFojaExtra;
    }
    const honorarioPesos = urTotal * tasas.urSemestralPesos;
    const formulaDescripcion = `${urTotal} UR (${fojas} foja(s)) según ${hp.raw}`;
    return honorarioMontoSimple(regla.articulo, honorarioPesos, monedaPrincipal, tasas, formulaDescripcion);
  }

  if (hp.tipo === "porcentaje") {
    const pct = hp.valor / 100;
    const baseR = calcularValorBase(regla.detalleSpec, valores, principalAPesos, regla);
    if (!baseR.ok) {
      return { error: baseR.mensaje };
    }
    const montoPesosBruto = baseR.basePesos * pct;
    const principalRd = honorarioPrincipalRedondeadoDesdePesosBrutos(
      montoPesosBruto,
      monedaPrincipal,
      tasas
    );
    const montoPesos = honorarioPesosDesdePrincipalEntero(principalRd, monedaPrincipal, tasas);
    return {
      tipo: "porcentaje",
      porcentaje: hp.valor,
      porcentajeTexto: regla.honorarioParsed.raw,
      basePesos: baseR.basePesos,
      baseDescripcion: baseR.descripcion,
      montoPesos,
      montoPesosFormateado: formatHonorarioPesosMostrar(montoPesos),
      montoPrincipalFormateado: `${formatoHonorarioEntero(principalRd)} ${ETIQUETA_MONEDA[monedaPrincipal]}`,
      monedaPrincipal,
      articulo: regla.articulo,
    };
  }

  return { error: `Honorario no reconocido: ${(hp as { raw?: string }).raw ?? ""}` };
}

export function necesitaValoresBase(spec: DetalleSpec): boolean {
  switch (spec.kind) {
    case "fijo_sin_entrada":
      return false;
    default:
      return true;
  }
}

export function requiereCamposUsufructo(regla: Regla | undefined): boolean {
  return Boolean(
    regla?.tablaUsufructo &&
      regla.detalleSpec.kind === "max_partes_catastral"
  );
}

/** Documentos que piden montos o fojas antes de calcular (no UR fija sola). */
export function reglaRequiereEntradaMontos(regla: Regla): boolean {
  const t = regla.honorarioParsed.tipo;
  if (t === "desconocido") return false;
  if (t === "ur_fijo") return false;
  if (t === "porcentaje") return regla.detalleSpec.kind !== "fijo_sin_entrada";
  return true;
}
