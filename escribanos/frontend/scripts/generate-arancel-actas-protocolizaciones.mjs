/**
 * Lee escribanos/documents/actasyprotocolizaciones.csv → lib/arancel/capitulo-iii-data.json
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const csvPath = path.join(root, "..", "documents", "actasyprotocolizaciones.csv");
const outPath = path.join(root, "lib", "arancel", "capitulo-iii-data.json");

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

function parseHonorarioCapIII(raw) {
  const s = String(raw || "").trim();
  const mFojas = s.match(
    /(\d+(?:[.,]\d+)?)\s*UR\s*semestral\s+hasta\s+(\d+)\s+fojas?\s+y\s+([\d,\s]+)\s*UR\s*por\s+cada\s+foja\s+subsiguiente/i
  );
  if (mFojas) {
    const urPlana = parseFloat(String(mFojas[1]).replace(",", "."));
    const fojasIncluidas = parseInt(mFojas[2], 10);
    const urPorFojaExtra = parseFloat(String(mFojas[3]).replace(/\s/g, "").replace(",", "."));
    return {
      tipo: "ur_por_fojas",
      urPlana,
      fojasIncluidas,
      urPorFojaExtra,
      raw: s,
    };
  }
  const mUr = s.match(/^([\d.,\s]+)\s*UR\s*semestral/i);
  if (mUr) {
    const ur = parseFloat(mUr[1].replace(/\s/g, "").replace(",", "."));
    const maxCap = s.match(/maximo\s+de\s+(\d+)\s*UR/i);
    return {
      tipo: "ur_fijo",
      ur,
      periodo: "semestral",
      ...(maxCap ? { maxUr: parseInt(maxCap[1], 10) } : {}),
      raw: s,
    };
  }
  return { tipo: "desconocido", raw: s };
}

function detalleCapIII(valorBaseCol, hp) {
  const d = String(valorBaseCol || "").trim();
  if (hp.tipo === "ur_por_fojas") {
    return {
      kind: "testimonio_fojas",
      textoOriginal: d || "Número de fojas",
    };
  }
  if (hp.tipo === "ur_fijo") {
    return { kind: "fijo_sin_entrada", textoOriginal: d };
  }
  if (d) return { kind: "generico", textoOriginal: d };
  return { kind: "sin_detalle_pct", textoOriginal: "" };
}

const text = fs.readFileSync(csvPath, "utf8");
const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
parseCsvLine(lines[0]);

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

  const hp = parseHonorarioCapIII(honorarioRaw);
  const detalleSpec = detalleCapIII(valorBase, hp);

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

const capituloKey = "CAPITULO III - ACTAS Y PROTOCOLIZACIONES";
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
  capituloId: "actas-protocolizaciones",
  capituloLabel: "Actas y Protocolizaciones",
  capituloCsv: capituloKey,
  documentos,
  reglas,
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(output, null, 2), "utf8");
console.log("Wrote", outPath, "docs:", documentos.length);
