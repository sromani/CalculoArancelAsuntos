/**
 * Lee escribanos/documents/actosycontratos.csv y escribe lib/arancel/capitulo-i-data.json
 * Ejecutar desde escribanos/frontend: node scripts/generate-arancel-capitulo-i.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const csvPath = path.join(root, "..", "documents", "actosycontratos.csv");
const outPath = path.join(root, "lib", "arancel", "capitulo-i-data.json");

function parseCsvLine(line) {
  const result = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === "," && !inQuotes) {
      result.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  result.push(cur);
  return result;
}

function parseHonorario(raw) {
  const s = String(raw || "").trim();
  const pct = s.match(/^([\d.,]+)\s*%$/);
  if (pct) {
    const valor = parseFloat(pct[1].replace(",", "."));
    return { tipo: "porcentaje", valor, raw: s };
  }
  const ur = s.match(/^([\d.,]+)\s*UR\s*(semestral|semestrales)?\s*$/i);
  if (ur) {
    const u = parseFloat(ur[1].replace(",", "."));
    return {
      tipo: "ur_fijo",
      ur: u,
      periodo: ur[2] ? "semestral" : undefined,
      raw: s,
    };
  }
  return { tipo: "desconocido", raw: s };
}

function detalleToSpec(detalle, honorarioParsed) {
  const d = String(detalle || "").trim();
  const norm = d.replace(/\s+/g, " ").toLowerCase();

  if (!d) {
    if (honorarioParsed.tipo === "porcentaje") {
      return { kind: "sin_detalle_pct", textoOriginal: "" };
    }
    return { kind: "fijo_sin_entrada", textoOriginal: "" };
  }

  if (norm.includes("valor catastral") && norm.includes("partes") && norm.includes("mayor")) {
    return { kind: "max_partes_catastral", textoOriginal: d };
  }
  if (norm === "valor asignado por las partes" || norm.startsWith("valor asignado por las partes,")) {
    return { kind: "solo_partes", textoOriginal: d };
  }
  if (norm.includes("capital social")) {
    return { kind: "capital_social", textoOriginal: d };
  }
  if (norm.includes("aumento de capital")) {
    return { kind: "aumento_capital", textoOriginal: d };
  }
  if (norm.includes("aumento de precio")) {
    return { kind: "aumento_precio", textoOriginal: d };
  }
  if (norm.includes("importe total") && norm.includes("pagos") && norm.includes("periodico")) {
    const tope = norm.includes("tope ur 500");
    return {
      kind: "importe_pagos_periodicos",
      conTopeUr500: tope,
      textoOriginal: d,
    };
  }

  return { kind: "generico", textoOriginal: d };
}

const text = fs.readFileSync(csvPath, "utf8");
const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
const header = parseCsvLine(lines[0]);
if (header.length < 9) {
  console.error("CSV inesperado", header);
  process.exit(1);
}

const rows = [];
for (let i = 1; i < lines.length; i++) {
  const cols = parseCsvLine(lines[i]);
  if (cols.length < 9) continue;

  const capitulo = cols[1]?.trim() || "";
  const posDoc = parseInt(cols[2], 10);
  const documento = cols[3]?.trim() || "";
  const posBienStr = cols[4]?.trim() || "";
  const bien = cols[5]?.trim() || "";
  const articulo = cols[6]?.trim() || "";
  const honorarioRaw = cols[7]?.trim() || "";
  const detalleValorBase = cols[8]?.trim() || "";

  const posBien = posBienStr === "" ? null : parseInt(posBienStr, 10);
  const hp = parseHonorario(honorarioRaw);
  const detalleSpec = detalleToSpec(detalleValorBase, hp);

  rows.push({
    capitulo,
    posDoc,
    documento,
    posBien,
    bien,
    articulo,
    honorarioRaw,
    honorarioParsed: hp,
    detalleValorBase,
    detalleSpec,
  });
}

const capituloKey = "CAPITULO I - ACTOS Y CONTRATOS";

const byPosDoc = new Map();
for (const r of rows) {
  if (r.capitulo !== capituloKey) continue;
  if (!byPosDoc.has(r.posDoc)) {
    byPosDoc.set(r.posDoc, []);
  }
  byPosDoc.get(r.posDoc).push(r);
}

const documentos = [];
for (const [posDoc, list] of [...byPosDoc.entries()].sort((a, b) => a[0] - b[0])) {
  const nombre = list[0].documento;
  const conBien = list.filter((x) => x.posBien != null && x.bien);
  const opcionesBien = conBien
    .sort((a, b) => (a.posBien ?? 0) - (b.posBien ?? 0))
    .map((x) => ({
      posBien: x.posBien,
      etiqueta: titleCaseBien(x.bien),
      bienRaw: x.bien,
    }));

  documentos.push({
    posDoc,
    nombre,
    tieneSeleccionBien: opcionesBien.length > 0,
    opcionesBien,
  });
}

function tablaUsufructoFor(documento, bienRaw) {
  const d = String(documento || "").toUpperCase();
  const b = String(bienRaw || "").toUpperCase();
  if (!b.includes("INMUEBLE")) return undefined;
  if (d.includes("USUFRUCTO") && d.includes("DERECHO")) return "usufructo";
  if (d.includes("USO") && d.includes("DERECHO")) return "uso";
  return undefined;
}

const reglas = {};
for (const r of rows) {
  if (r.capitulo !== capituloKey) continue;
  const key =
    r.posBien != null && r.bien ? `${r.posDoc}-${r.posBien}` : `${r.posDoc}`;
  const tu = tablaUsufructoFor(r.documento, r.bien);
  reglas[key] = {
    articulo: r.articulo,
    honorarioParsed: r.honorarioParsed,
    detalleValorBase: r.detalleValorBase,
    detalleSpec: r.detalleSpec,
    ...(tu ? { tablaUsufructo: tu } : {}),
  };
}

const output = {
  version: 1,
  capituloId: "actos-contratos",
  capituloLabel: "Actos y Contratos",
  capituloCsv: capituloKey,
  documentos,
  reglas,
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(output, null, 2), "utf8");
console.log("Wrote", outPath, "rows:", rows.length, "reglas:", Object.keys(reglas).length);

function titleCaseBien(s) {
  const t = s.toLowerCase();
  return t.replace(/\b\w/g, (c) => c.toUpperCase());
}
