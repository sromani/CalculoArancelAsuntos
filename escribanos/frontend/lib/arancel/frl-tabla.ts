/**
 * Fondo de Reconversión Laboral — importes de referencia en pesos uruguayos.
 * Fuente: escribanos/documents/frl.csv
 */
export type OpcionFrl = {
  id: string;
  etiqueta: string;
  /** Monto tabulado en $ (pesos uruguayos); se convierte a la moneda de visualización con cotización del día. */
  pesosUruguayos: number;
};

export const OPCIONES_FRL_TABLA: readonly OpcionFrl[] = [
  { id: "frl-0", etiqueta: "Hasta 3 años", pesosUruguayos: 37 },
  { id: "frl-1", etiqueta: "De más de 3 años a 6 años", pesosUruguayos: 69 },
  { id: "frl-2", etiqueta: "De más de 6 años a 9 años", pesosUruguayos: 98 },
  { id: "frl-3", etiqueta: "De más de 9 años a 12 años", pesosUruguayos: 123 },
  { id: "frl-4", etiqueta: "De más de 12 años a 15 años", pesosUruguayos: 144 },
  { id: "frl-5", etiqueta: "De más de 15 años a 18 años", pesosUruguayos: 162 },
  { id: "frl-6", etiqueta: "De más de 18 años a 21 años", pesosUruguayos: 175 },
  { id: "frl-7", etiqueta: "De más de 21 años a 24 años", pesosUruguayos: 185 },
  { id: "frl-8", etiqueta: "De más de 24 años a 27 años", pesosUruguayos: 191 },
  { id: "frl-9", etiqueta: "De más de 27 años", pesosUruguayos: 192 },
] as const;

export const FRL_OPCION_DEFAULT_ID = OPCIONES_FRL_TABLA[0].id;

export const OPCIONES_FRL_FORM_SELECT = OPCIONES_FRL_TABLA.map((o) => ({
  value: o.id,
  label: `${o.etiqueta} (tabla $ ${o.pesosUruguayos})`,
}));

export function pesosFrlPorOpcionId(id: string): number {
  const o = OPCIONES_FRL_TABLA.find((x) => x.id === id);
  return o?.pesosUruguayos ?? 0;
}
