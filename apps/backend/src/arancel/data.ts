import type { CapituloIData } from "./types";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const capI = require("./capitulo-i-data.json") as CapituloIData;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const capII = require("./capitulo-ii-data.json") as CapituloIData;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const capIII = require("./capitulo-iii-data.json") as CapituloIData;

export const capituloActosContratos: CapituloIData = capI as CapituloIData;
export const capituloCertificaciones: CapituloIData = capII as CapituloIData;
export const capituloActasProtocolizaciones: CapituloIData = capIII as CapituloIData;

export const datosPorCapitulo: Record<string, CapituloIData> = {
  "actos-contratos": capituloActosContratos,
  certificaciones: capituloCertificaciones,
  "actas-protocolizaciones": capituloActasProtocolizaciones,
};
