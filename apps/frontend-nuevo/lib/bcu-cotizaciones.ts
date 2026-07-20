/**
 * Utilidades de fechas y tipos para cotizaciones BCU (WSCotizaciones).
 * Códigos: 9800 Unidad Indexada, 9900 Unidad Reajustable.
 * El dólar al público: INE (ver `lib/dolar-publico.ts`).
 */

export const BCU_CODIGO_UI = 9800;
export const BCU_CODIGO_UR = 9900;

export type CotizacionesSimulador = {
  fechaFirma: string;
  /** Día hábil inmediatamente anterior a la fecha del acto (criterio para el dólar). */
  fechaDiaHabilAnteriorActo: string;
  fechaConsultaUiUr: string;
  fechaDolarCompra: string;
  /** INE (Cotización monedas); BROU solo si el INE falla y el día hábil anterior es hoy. */
  fuenteDolar: 'ine' | 'brou';
  /** Aviso si el dólar no vino del INE. */
  dolarNota?: string;
  dolarComprador: number;
  uiPesos: number;
  /** UR del mes (referencia BCU); el simulador usa urSemestralPesos para montos en UR y honorarios en UR. */
  urMensualPesos: number;
  urSemestralPesos: number;
  fechaReferenciaUrSemestral: string;
  actualizado: string;
};

/** YYYY-MM-DD en calendario local (Uruguay). */
export function formatDateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseDateLocal(iso: string): Date {
  const [y, m, day] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, day ?? 1);
}

/** Sábado = 6, domingo = 0 */
export function esFinDeSemana(d: Date): boolean {
  const day = d.getDay();
  return day === 0 || day === 6;
}

/** Día hábil anterior (solo excluye sábado y domingo; no feriados). */
export function diaHabilAnterior(fecha: Date): Date {
  const x = new Date(fecha);
  x.setDate(x.getDate() - 1);
  while (esFinDeSemana(x)) {
    x.setDate(x.getDate() - 1);
  }
  return x;
}

/**
 * Para consultar UI/UR “del día”: si cae fin de semana, se usa el viernes anterior
 * (último día con publicación típica).
 */
export function fechaConsultaIndices(fecha: Date): Date {
  const x = new Date(fecha);
  while (esFinDeSemana(x)) {
    x.setDate(x.getDate() - 1);
  }
  return x;
}

/**
 * UR semestral del arancel: diciembre del año anterior (1 ene – 30 jun)
 * o junio del año en curso (1 jul – 31 dic).
 * Se usa el último día de ese mes como referencia de consulta.
 */
export function fechaReferenciaUrSemestral(fechaFirma: Date): Date {
  const y = fechaFirma.getFullYear();
  const month = fechaFirma.getMonth();
  if (month <= 5) {
    return new Date(y - 1, 11, 31);
  }
  return new Date(y, 5, 30);
}

export function extraerDatosCotizacion(xml: string): { fecha: string; moneda: number; tcc: number }[] {
  const bloques = xml.match(/<datoscotizaciones\.dato[^>]*>[\s\S]*?<\/datoscotizaciones\.dato>/gi) ?? [];
  const out: { fecha: string; moneda: number; tcc: number }[] = [];
  for (const b of bloques) {
    const fecha = b.match(/<Fecha>([^<]*)<\/Fecha>/i)?.[1]?.trim() ?? '';
    const moneda = Number(b.match(/<Moneda>(\d+)<\/Moneda>/i)?.[1]);
    const tcc = Number(b.match(/<TCC>([\d.]+)<\/TCC>/i)?.[1]);
    if (fecha && Number.isFinite(moneda) && Number.isFinite(tcc) && tcc > 0) {
      out.push({ fecha, moneda, tcc });
    }
  }
  return out;
}

export function statusOk(xml: string): boolean {
  const m = xml.match(/<status>(\d+)<\/status>/i);
  return m?.[1] === '1';
}

export function mensajeError(xml: string): string {
  return xml.match(/<mensaje>([^<]*)<\/mensaje>/i)?.[1]?.trim() ?? '';
}

export function armarSoapCotizacion(codigos: number[], fechaDesde: string, fechaHasta: string): string {
  const items = codigos.map((c) => `<cot:item>${c}</cot:item>`).join('');
  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:cot="Cotiza">
  <soapenv:Body>
    <cot:wsbcucotizaciones.Execute>
      <cot:Entrada>
        <cot:Moneda>${items}</cot:Moneda>
        <cot:FechaDesde>${fechaDesde}</cot:FechaDesde>
        <cot:FechaHasta>${fechaHasta}</cot:FechaHasta>
        <cot:Grupo>2</cot:Grupo>
      </cot:Entrada>
    </cot:wsbcucotizaciones.Execute>
  </soapenv:Body>
</soapenv:Envelope>`;
}

/** Busca TCC para (moneda, fecha exacta); si no hay, el último dato de esa moneda en el rango. */
export function pickTcc(
  datos: { fecha: string; moneda: number; tcc: number }[],
  moneda: number,
  fechaObjetivo: string
): number | null {
  const filtro = datos.filter((d) => d.moneda === moneda);
  if (filtro.length === 0) return null;
  const exacto = filtro.find((d) => d.fecha === fechaObjetivo);
  if (exacto) return exacto.tcc;
  const ordenados = [...filtro].sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0));
  return ordenados[0]?.tcc ?? null;
}
