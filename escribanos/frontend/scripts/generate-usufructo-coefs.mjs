/**
 * Lee documents/tablausufructo.csv → lib/arancel/usufructo-coefs.json
 * Formato línea: 1,"0,9433 9623" (coma decimal, espacios en el número se eliminan)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const csvPath = path.join(root, "..", "documents", "tablausufructo.csv");
const outPath = path.join(root, "lib", "arancel", "usufructo-coefs.json");

const text = fs.readFileSync(csvPath, "utf8");
const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
const coefs = [];
for (const line of lines) {
  const m = line.match(/^(\d+),\s*"([^"]+)"/);
  if (!m) continue;
  const numStr = m[2].replace(/\s/g, "").replace(",", ".");
  const v = parseFloat(numStr);
  if (!Number.isFinite(v)) continue;
  coefs.push(v);
}
if (coefs.length !== 70) {
  console.warn("Se esperaban 70 coeficientes, hay:", coefs.length);
}
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify({ version: 1, coefs }, null, 2), "utf8");
console.log("Wrote", outPath, "n=", coefs.length);
