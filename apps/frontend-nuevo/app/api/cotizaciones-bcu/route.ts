import { NextResponse } from 'next/server';
import {
  armarSoapCotizacion,
  BCU_CODIGO_UI,
  BCU_CODIGO_UR,
  diaHabilAnterior,
  extraerDatosCotizacion,
  fechaConsultaIndices,
  fechaReferenciaUrSemestral,
  formatDateLocal,
  parseDateLocal,
  pickTcc,
  statusOk,
  type CotizacionesSimulador,
} from '@/lib/bcu-cotizaciones';
import { obtenerDolarDiaHabilAnterior } from '@/lib/dolar-publico';

export const runtime = 'nodejs';

const BCU_URL = 'https://cotizaciones.bcu.gub.uy/wscotizaciones/servlet/awsbcucotizaciones';

function detalleErrorRed(e: unknown): string {
  if (!(e instanceof Error)) return String(e);
  const partes = [e.message];
  const c = e.cause;
  if (c instanceof Error) {
    partes.push(`causa: ${c.message}`);
  } else if (c != null && typeof c === 'object' && 'code' in c) {
    partes.push(`código: ${String((c as { code: unknown }).code)}`);
  } else if (c != null) {
    partes.push(`causa: ${String(c)}`);
  }
  return partes.join(' — ');
}

async function postSoap(body: string): Promise<string> {
  const res = await fetch(BCU_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      SOAPAction: 'Cotizaction.Execute',
    },
    body,
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) {
    throw new Error(`BCU HTTP ${res.status}`);
  }
  return res.text();
}

/**
 * Repite consultas acortando el rango hacia atrás si falta cotización (ej. feriado).
 */
async function cotizacionConFallback(codigos: number[], fechaObjetivo: string): Promise<{ xml: string; fechaUsada: string }> {
  let f = parseDateLocal(fechaObjetivo);
  for (let i = 0; i < 12; i++) {
    const desde = formatDateLocal(f);
    const xml = await postSoap(armarSoapCotizacion(codigos, desde, desde));
    if (statusOk(xml)) {
      const datos = extraerDatosCotizacion(xml);
      const ok = codigos.every((c) => pickTcc(datos, c, desde) != null);
      if (ok) {
        return { xml, fechaUsada: desde };
      }
    }
    f.setDate(f.getDate() - 1);
  }
  throw new Error('No se obtuvieron cotizaciones BCU para las fechas intentadas.');
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fechaParam = searchParams.get('fecha');
  let fechaFirma: Date;
  try {
    fechaFirma = fechaParam ? parseDateLocal(fechaParam) : new Date();
    if (Number.isNaN(fechaFirma.getTime())) {
      return NextResponse.json({ error: 'Fecha inválida' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Fecha inválida' }, { status: 400 });
  }

  const fechaFirmaStr = formatDateLocal(fechaFirma);
  const hoyStr = formatDateLocal(new Date());
  if (fechaFirmaStr > hoyStr) {
    return NextResponse.json(
      { error: 'La fecha del acto no puede ser posterior a hoy.', paso: 'validacion' },
      { status: 400 }
    );
  }

  const fDolar = diaHabilAnterior(fechaFirma);
  const fDolarStr = formatDateLocal(fDolar);
  const fIndices = fechaConsultaIndices(fechaFirma);
  const fIndicesStr = formatDateLocal(fIndices);
  const fUrSem = fechaReferenciaUrSemestral(fechaFirma);
  const fUrSemStr = formatDateLocal(fUrSem);

  let dolar: number;
  let fechaDolarUsada: string;
  let fuenteDolar: 'ine' | 'brou';
  let dolarNota: string | undefined;
  try {
    const d = await obtenerDolarDiaHabilAnterior(fDolarStr);
    dolar = d.valor;
    fechaDolarUsada = d.fechaUsadaYmd;
    fuenteDolar = d.fuenteDolar;
    dolarNota = d.nota;
  } catch (e) {
    return NextResponse.json(
      {
        error: 'No se pudo obtener la cotización del dólar (día hábil anterior al acto).',
        detalle: detalleErrorRed(e),
        paso: 'dolar',
      },
      { status: 502 }
    );
  }

  let fechaUiUrUsada: string;
  let ui: number;
  let urMes: number;
  try {
    const { xml: xmlUiUr, fechaUsada } = await cotizacionConFallback(
      [BCU_CODIGO_UI, BCU_CODIGO_UR],
      fIndicesStr
    );
    fechaUiUrUsada = fechaUsada;
    const datosUiUr = extraerDatosCotizacion(xmlUiUr);
    const uiVal = pickTcc(datosUiUr, BCU_CODIGO_UI, fechaUiUrUsada);
    const urMesVal = pickTcc(datosUiUr, BCU_CODIGO_UR, fechaUiUrUsada);
    if (uiVal == null || urMesVal == null) {
      throw new Error('Sin cotización UI/UR');
    }
    ui = uiVal;
    urMes = urMesVal;
  } catch (e) {
    return NextResponse.json(
      {
        error: 'No se pudieron obtener UI ni UR mensual del BCU.',
        detalle: detalleErrorRed(e),
        paso: 'bcu_ui_ur',
      },
      { status: 502 }
    );
  }

  let fechaUrSemUsada: string;
  let urSem: number;
  try {
    const { xml: xmlUrSem, fechaUsada } = await cotizacionConFallback([BCU_CODIGO_UR], fUrSemStr);
    fechaUrSemUsada = fechaUsada;
    const datosUrSem = extraerDatosCotizacion(xmlUrSem);
    const urSemVal = pickTcc(datosUrSem, BCU_CODIGO_UR, fechaUrSemUsada);
    if (urSemVal == null) {
      throw new Error('Sin cotización UR semestral');
    }
    urSem = urSemVal;
  } catch (e) {
    return NextResponse.json(
      {
        error: 'No se pudo obtener la UR semestral del BCU.',
        detalle: detalleErrorRed(e),
        paso: 'bcu_ur_semestral',
      },
      { status: 502 }
    );
  }

  const payload: CotizacionesSimulador = {
    fechaFirma: fechaFirmaStr,
    fechaDiaHabilAnteriorActo: fDolarStr,
    fechaConsultaUiUr: fechaUiUrUsada,
    fechaDolarCompra: fechaDolarUsada,
    fuenteDolar,
    dolarComprador: dolar,
    uiPesos: ui,
    urMensualPesos: urMes,
    urSemestralPesos: urSem,
    fechaReferenciaUrSemestral: fechaUrSemUsada,
    actualizado: new Date().toISOString(),
    ...(dolarNota ? { dolarNota } : {}),
  };

  return NextResponse.json(payload, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
    },
  });
}
