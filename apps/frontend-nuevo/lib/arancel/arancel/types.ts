export type HonorarioParsed =
  | { tipo: "porcentaje"; valor: number; raw: string }
  | { tipo: "ur_fijo"; ur: number; periodo?: string; maxUr?: number; raw: string }
  | {
      tipo: "por_mil_con_min_ur";
      porMil: number;
      minUr: number;
      raw: string;
    }
  | {
      tipo: "por_mil_con_max_ur";
      porMil: number;
      maxUr: number;
      raw: string;
    }
  | {
      tipo: "ur_por_fojas";
      urPlana: number;
      fojasIncluidas: number;
      urPorFojaExtra: number;
      raw: string;
    }
  | { tipo: "desconocido"; raw: string };

export type DetalleSpec =
  | { kind: "max_partes_catastral"; textoOriginal: string }
  | { kind: "solo_partes"; textoOriginal: string }
  | { kind: "capital_social"; textoOriginal: string }
  | { kind: "aumento_capital"; textoOriginal: string }
  | { kind: "aumento_precio"; textoOriginal: string }
  | { kind: "importe_pagos_periodicos"; conTopeUr500?: boolean; textoOriginal: string }
  | { kind: "generico"; textoOriginal: string }
  | { kind: "sin_detalle_pct"; textoOriginal: string }
  | { kind: "fijo_sin_entrada"; textoOriginal: string }
  | { kind: "testimonio_fojas"; textoOriginal: string };

export type Regla = {
  articulo: string;
  honorarioParsed: HonorarioParsed;
  detalleValorBase: string;
  detalleSpec: DetalleSpec;
  /** Literal L arancel: usufructo o uso sobre inmueble (tabla + valor real proporcional). */
  tablaUsufructo?: "usufructo" | "uso";
};

export type DocumentoArancel = {
  posDoc: number;
  nombre: string;
  tieneSeleccionBien: boolean;
  opcionesBien: { posBien: number; etiqueta: string; bienRaw: string }[];
};

export type CapituloIData = {
  version: number;
  capituloId: string;
  capituloLabel: string;
  capituloCsv: string;
  documentos: DocumentoArancel[];
  reglas: Record<string, Regla>;
};
