import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const src = fs.readFileSync(path.join(root, "escribanos/frontend/app/globals.css"), "utf8").split(/\r?\n/);
const header = `/* Simulador legacy */
.simulador-legacy {
  --verde-principal: #00a651;
  --verde-oscuro: #008f47;
  --verde-titulo: #1b5e20;
  --verde-subtitulo: #2e7d32;
  --fondo-blanco: #ffffff;
  --fondo-verde-muy-claro: #f8fdf9;
  --fondo-verde-claro: #e8f5e9;
  --gris-texto: #666666;
  --gris-borde: #e0e0e0;
  --color-neutral-800: #1e293b;
}
.simulador-legacy .simulador-container {
  min-height: auto;
  background: transparent;
  padding: 0;
}
`;
const body = src.slice(932, 1292).concat(src.slice(2372, 2442)).join("\n");
fs.writeFileSync(path.join(root, "apps/frontend-nuevo/app/simulador-legacy.css"), header + body, "utf8");
console.log("OK");
