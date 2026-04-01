/**
 * Lee escribanos/documents/certificaciones.csv → lib/arancel/capitulo-ii-data.json
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const csvPath = path.join(root, "..", "documents", "certificaciones.csv");
const outPath = path.join(root, "lib", "arancel", "capitulo-ii-data.json");

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

function parseHonorarioCert(raw) {
  const s = String(raw || "").trim();
  const urLoose = s.match(/^([\d.,\s]+)\s*UR\s*(semestral|semestrales)?\s*$/i);
  if (urLoose) {
    const u = parseFloat(urLoose[1].replace(/\s/g, "").replace(",", "."));
    return {
      tipo: "ur_fijo",
      ur: u,
      periodo: urLoose[2] ? "semestral" : undefined,
      raw: s,
    };
  }
  if (/5o\/oo\s+y\s+nunca\s+menos\s+de\s+40\s*UR/i.test(s)) {
    return { tipo: "por_mil_con_min_ur", porMil: 5, minUr: 40, raw: s };
  }
  if (/1o\/oo\s+y\s+nunca\s+menos\s+de\s+40\s*UR/i.test(s)) {
    return { tipo: "por_mil_con_min_ur", porMil: 1, minUr: 40, raw: s };
  }
  if (/1o\/oo\s+con\s+monto\s+maximo\s+de\s+200\s*UR/i.test(s)) {
    return { tipo: "por_mil_con_max_ur", porMil: 1, maxUr: 200, raw: s };
  }
  if (/0,5\s*UR\s*HASTA\s*2\s*FOJAS/i.test(s)) {
    return {
      tipo: "ur_por_fojas",
      urPlana: 0.5,
      fojasIncluidas: 2,
      urPorFojaExtra: 0.1,
      raw: s,
    };
  }
  return { tipo: "desconocido", raw: s };
}

function detalleCert(valorBaseCol, hp) {
  const d = String(valorBaseCol || "").trim();
  if (
    hp.tipo === "por_mil_con_min_ur" ||
    hp.tipo === "por_mil_con_max_ur"
  ) {
    return {
      kind: "capital_social",
      textoOriginal: d || "Capital social (aplicable al honorario)",
    };
  }
  if (hp.tipo === "ur_por_fojas") {
    return {
      kind: "testimonio_fojas",
      textoOriginal: d || "Número de fojas",
    };
  }
  if (hp.tipo === "ur_fijo") {
    return { kind: "fijo_sin_entrada", textoOriginal: d };
  }
  if (d) {
    return { kind: "generico", textoOriginal: d };
  }
  return { kind: "sin_detalle_pct", textoOriginal: "" };
}

const text = fs.readFileSync(csvPath, "utf8");
const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
const header = parseCsvLine(lines[0]);

const rows = [];
for (let i = 1; i < lines.length; i++) {
  const cols = parseCsvLine(lines[i]);
  if (cols.length < 9) continue;

  const capitulo = cols[1]?.trim() || "";
  const posDoc = parseInt(cols[2], 10);
  const documento = cols[3]?.trim() || "";
  const articulo = cols[6]?.trim() || "";
  const valorBase = cols[7]?.trim() || "";
  const honorarioRaw = cols[8]?.trim() || "";

  const hp = parseHonorarioCert(honorarioRaw);
  const detalleSpec = detalleCert(valorBase, hp);

  rows.push({
    capitulo,
    posDoc,
    documento,
    articulo,
    honorarioRaw,
    honorarioParsed: hp,
    detalleValorBase: valorBase,
    detalleSpec,
  });
}

const capituloKey = "CAPITULO II - CERTIFICACIONES";
const filtered = rows.filter((r) => r.capitulo === capituloKey);

const documentos = filtered.map((r) => ({
  posDoc: r.posDoc,
  nombre: r.documento,
  tieneSeleccionBien: false,
  opcionesBien: [],
}));

const reglas = {};
for (const r of filtered) {
  reglas[`${r.posDoc}`] = {
    articulo: r.articulo,
    honorarioParsed: r.honorarioParsed,
    detalleValorBase: r.detalleValorBase,
    detalleSpec: r.detalleSpec,
  };
}

const output = {
  version: 1,
  capituloId: "certificaciones",
  capituloLabel: "Certificaciones",
  capituloCsv: capituloKey,
  documentos,
  reglas,
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(output, null, 2), "utf8");
console.log("Wrote", outPath, "docs:", documentos.length);
