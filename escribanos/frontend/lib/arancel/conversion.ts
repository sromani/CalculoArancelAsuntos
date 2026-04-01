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
