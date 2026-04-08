import { datosPorCapitulo } from "./data";

export const CAPITULO_IDS_SIMULADOR = [
  "actos-contratos",
  "certificaciones",
  "actas-protocolizaciones",
] as const;

export type CapituloIdSimulador = (typeof CAPITULO_IDS_SIMULADOR)[number];

export type ActoSimuladorOpcion = {
  key: string;
  capituloId: CapituloIdSimulador;
  posDoc: number;
  nombre: string;
};

const SEP = "|";

export function encodeActoKey(capituloId: string, posDoc: number): string {
  return `${capituloId}${SEP}${posDoc}`;
}

export function parseActoKey(key: string): { capituloId: CapituloIdSimulador; posDoc: number } | null {
  const i = key.lastIndexOf(SEP);
  if (i <= 0 || i >= key.length - 1) return null;
  const capituloId = key.slice(0, i);
  const posDoc = Number(key.slice(i + 1));
  if (!(CAPITULO_IDS_SIMULADOR as readonly string[]).includes(capituloId)) return null;
  if (!Number.isFinite(posDoc) || posDoc < 1) return null;
  return { capituloId: capituloId as CapituloIdSimulador, posDoc };
}

/** Todos los documentos de los tres capítulos, orden alfabético por nombre (es). */
export function listaActosSimuladorOrdenada(): ActoSimuladorOpcion[] {
  const out: ActoSimuladorOpcion[] = [];
  for (const capituloId of CAPITULO_IDS_SIMULADOR) {
    const cap = datosPorCapitulo[capituloId];
    for (const d of cap.documentos) {
      out.push({
        key: encodeActoKey(capituloId, d.posDoc),
        capituloId,
        posDoc: d.posDoc,
        nombre: d.nombre,
      });
    }
  }
  return out.sort((a, b) => a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" }));
}
