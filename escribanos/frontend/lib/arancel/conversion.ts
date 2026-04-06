export type MonedaEntrada = 'USD' | 'UYU' | 'UI' | 'UR';

export type TasasLineas = {
  dolarComprador: number;
  uiPesos: number;
  urSemestralPesos: number;
};

/** Convierte monto ingresado en la moneda elegida a pesos uruguayos. UR usa siempre cotización semestral. */
export function montoPrincipalAPesos(cantidad: number, moneda: MonedaEntrada, tasas: TasasLineas): number {
  switch (moneda) {
    case 'UYU':
      return cantidad;
    case 'USD':
      return cantidad * tasas.dolarComprador;
    case 'UI':
      return cantidad * tasas.uiPesos;
    case 'UR':
      return cantidad * tasas.urSemestralPesos;
    default: {
      const _e: never = moneda;
      return _e;
    }
  }
}

export function pesosAMontoPrincipal(pesos: number, moneda: MonedaEntrada, tasas: TasasLineas): number {
  switch (moneda) {
    case 'UYU':
      return pesos;
    case 'USD':
      return pesos / tasas.dolarComprador;
    case 'UI':
      return pesos / tasas.uiPesos;
    case 'UR':
      return pesos / tasas.urSemestralPesos;
    default: {
      const _e: never = moneda;
      return _e;
    }
  }
}

/** Honorario en moneda de visualización: redondeo hacia arriba a la unidad entera ($, USD, UI o UR). */
export function honorarioPrincipalHaciaArriba(principal: number): number {
  if (!Number.isFinite(principal) || principal <= 0) return 0;
  return Math.ceil(principal - 1e-9);
}

export function honorarioPrincipalRedondeadoDesdePesosBrutos(
  honorarioPesosBruto: number,
  moneda: MonedaEntrada,
  tasas: TasasLineas
): number {
  return honorarioPrincipalHaciaArriba(pesosAMontoPrincipal(honorarioPesosBruto, moneda, tasas));
}

export function honorarioPesosDesdePrincipalEntero(
  principalEntero: number,
  moneda: MonedaEntrada,
  tasas: TasasLineas
): number {
  return montoPrincipalAPesos(principalEntero, moneda, tasas);
}

export function formatoHonorarioEntero(n: number): string {
  return new Intl.NumberFormat('es-UY', { maximumFractionDigits: 0, minimumFractionDigits: 0 }).format(
    Math.round(n)
  );
}

export const ETIQUETA_MONEDA: Record<MonedaEntrada, string> = {
  USD: 'USD',
  UYU: '$',
  UI: 'UI',
  UR: 'UR',
};

export const OPCIONES_MONEDA_FORM = [
  { value: 'USD' as const, label: 'Dólares estadounidenses (USD)' },
  { value: 'UYU' as const, label: 'Pesos uruguayos ($)' },
  { value: 'UI' as const, label: 'Unidad Indexada (UI, valor del día)' },
  { value: 'UR' as const, label: 'Unidad Reajustable (UR, cotización semestral)' },
];
