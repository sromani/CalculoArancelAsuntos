import { NextResponse } from 'next/server';
import {
  armarSoapCotizacion,
  BCU_CODIGO_DOLAR_BILLETE,
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

const BCU_URL = 'https://cotizaciones.bcu.gub.uy/wscotizaciones/servlet/awsbcucotizaciones';

async function postSoap(body: string): Promise<string> {
  const res = await fetch(BCU_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      SOAPAction: 'Cotizaction.Execute',
    },
    body,
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
  const fDolar = diaHabilAnterior(fechaFirma);
  const fDolarStr = formatDateLocal(fDolar);
  const fIndices = fechaConsultaIndices(fechaFirma);
  const fIndicesStr = formatDateLocal(fIndices);
  const fUrSem = fechaReferenciaUrSemestral(fechaFirma);
  const fUrSemStr = formatDateLocal(fUrSem);

  try {
    const { xml: xmlDolar, fechaUsada: fechaDolarUsada } = await cotizacionConFallback(
      [BCU_CODIGO_DOLAR_BILLETE],
      fDolarStr
    );
    const datosDolar = extraerDatosCotizacion(xmlDolar);
    const dolar = pickTcc(datosDolar, BCU_CODIGO_DOLAR_BILLETE, fechaDolarUsada);
    if (dolar == null) {
      throw new Error('Sin cotización dólar');
    }

    const { xml: xmlUiUr, fechaUsada: fechaUiUrUsada } = await cotizacionConFallback(
      [BCU_CODIGO_UI, BCU_CODIGO_UR],
      fIndicesStr
    );
    const datosUiUr = extraerDatosCotizacion(xmlUiUr);
    const ui = pickTcc(datosUiUr, BCU_CODIGO_UI, fechaUiUrUsada);
    const urMes = pickTcc(datosUiUr, BCU_CODIGO_UR, fechaUiUrUsada);
    if (ui == null || urMes == null) {
      throw new Error('Sin cotización UI/UR');
    }

    const { xml: xmlUrSem, fechaUsada: fechaUrSemUsada } = await cotizacionConFallback(
      [BCU_CODIGO_UR],
      fUrSemStr
    );
    const datosUrSem = extraerDatosCotizacion(xmlUrSem);
    const urSem = pickTcc(datosUrSem, BCU_CODIGO_UR, fechaUrSemUsada);
    if (urSem == null) {
      throw new Error('Sin cotización UR semestral');
    }

    const payload: CotizacionesSimulador = {
      fechaFirma: fechaFirmaStr,
      fechaConsultaUiUr: fechaUiUrUsada,
      fechaDolarCompra: fechaDolarUsada,
      dolarComprador: dolar,
      uiPesos: ui,
      urMensualPesos: urMes,
      urSemestralPesos: urSem,
      fechaReferenciaUrSemestral: fechaUrSemUsada,
      actualizado: new Date().toISOString(),
    };

    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
      },
    });
  } catch (e) {
    const detalle = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: 'No se pudieron obtener cotizaciones del BCU.', detalle },
      { status: 502 }
    );
  }
}
