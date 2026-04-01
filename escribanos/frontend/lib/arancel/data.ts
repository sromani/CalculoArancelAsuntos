import type { CapituloIData } from "./types";
import capI from "./capitulo-i-data.json";
import capII from "./capitulo-ii-data.json";
import capIII from "./capitulo-iii-data.json";

export const capituloActosContratos: CapituloIData = capI as CapituloIData;
export const capituloCertificaciones: CapituloIData = capII as CapituloIData;
export const capituloActasProtocolizaciones: CapituloIData = capIII as CapituloIData;

export const datosPorCapitulo: Record<string, CapituloIData> = {
  "actos-contratos": capituloActosContratos,
  certificaciones: capituloCertificaciones,
  "actas-protocolizaciones": capituloActasProtocolizaciones,
};
