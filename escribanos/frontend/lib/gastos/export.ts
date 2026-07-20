import type { GastoRow } from "./types";
import { ETIQUETA_CATEGORIA, ETIQUETA_ESTADO_GASTO, ETIQUETA_MONEDA } from "./types";
import { fmtFecha, fmtImporte } from "./resumen";

export async function exportarGastosExcel(gastos: GastoRow[], nombreArchivo = "gastos.xlsx") {
  const XLSX = await import("xlsx");
  const filas = gastos.map((g) => ({
    Nombre: g.nombre,
    Categoría: ETIQUETA_CATEGORIA[g.categoria],
    "Oficina pública": g.oficinaPublica ?? "",
    Fecha: fmtFecha(g.fecha),
    Vencimiento: fmtFecha(g.fechaVencimiento),
    Importe: g.importe,
    Moneda: ETIQUETA_MONEDA[g.moneda],
    Estado: ETIQUETA_ESTADO_GASTO[g.estado],
    Cliente: g.cliente?.nombre ?? "",
    Asunto: g.asunto ? `#${g.asunto.ordinal}` : "",
    Observaciones: g.observaciones ?? "",
  }));
  const hoja = XLSX.utils.json_to_sheet(filas);
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, "Gastos");
  XLSX.writeFile(libro, nombreArchivo);
}

export function exportarGastosPdf(gastos: GastoRow[], titulo = "Gastos") {
  const filasHtml = gastos
    .map(
      (g) => `<tr>
        <td>${fmtFecha(g.fecha)}</td>
        <td>${escapeHtml(g.nombre)}</td>
        <td>${escapeHtml(ETIQUETA_CATEGORIA[g.categoria])}</td>
        <td style="text-align:right">${escapeHtml(fmtImporte(g.importe, g.moneda))}</td>
        <td>${escapeHtml(ETIQUETA_ESTADO_GASTO[g.estado])}</td>
        <td>${escapeHtml(g.cliente?.nombre ?? "—")}</td>
      </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(titulo)}</title>
    <style>
      body { font-family: system-ui, sans-serif; padding: 24px; color: #111; }
      h1 { font-size: 18px; margin-bottom: 8px; }
      table { width: 100%; border-collapse: collapse; font-size: 11px; }
      th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
      th { background: #f5f5f5; }
    </style></head><body>
    <h1>${escapeHtml(titulo)}</h1>
    <p>Generado ${new Date().toLocaleString("es-UY")} · ${gastos.length} registro(s)</p>
    <table>
      <thead><tr><th>Fecha</th><th>Nombre</th><th>Categoría</th><th>Importe</th><th>Estado</th><th>Cliente</th></tr></thead>
      <tbody>${filasHtml}</tbody>
    </table></body></html>`;

  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  w.print();
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
