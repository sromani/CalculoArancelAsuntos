import { setDefaultResultOrder } from 'node:dns';
import http from 'node:http';
import https from 'node:https';
import { URL as NodeURL } from 'node:url';
import * as XLSX from 'xlsx';
import { formatDateLocal, parseDateLocal } from '@/lib/bcu-cotizaciones';

/** Mitiga fallos tipo "fetch failed" en redes donde IPv6 no llega a .gub.uy. */
setDefaultResultOrder('ipv4first');

/** Pizarra pública BROU (portlet Liferay; mismo contenido que /cotizaciones/). */
const BROU_COTIZACIONES_PORTLET =
  'https://www.brou.com.uy/c/portal/render_portlet?p_l_id=20593&p_p_id=cotizacionfull_WAR_broutmfportlet_INSTANCE_otHfewh1klyS&p_p_lifecycle=0&p_p_state=normal&p_p_mode=view&p_p_col_id=column-1&p_p_col_pos=0&p_p_col_count=2&p_p_isolated=1&currentURL=%2Fcotizaciones%2F';

/**
 * URL exacta del archivo en el servidor INE (el segmento es "Estadísticaseconómicas", sin espacio;
 * si se usa "Estadísticas económicas" el sitio responde 404).
 */
const INE_XLSX_HREF =
  'https://www5.ine.gub.uy/documents/Estad%C3%ADsticasecon%C3%B3micas/SERIES%20Y%20OTROS/Cotizaci%C3%B3n%20monedas/Cotizaci%C3%B3n%20monedas.xlsx';

const COL_FECHA = 'Fecha';
const COL_DOLAR_COMPRA = 'Dólar.USA.Compra';

const INE_MAP_CACHE_MS = 1000 * 60 * 60 * 4;

const CHROME_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

type IneCache = { map: Map<string, number>; loadedAt: number };
let ineCache: IneCache | null = null;

/** Formato de fechas en el Excel del INE (dd-mm-aaaa). */
export function fechaIsoAUyIne(isoYmd: string): string {
  const d = parseDateLocal(isoYmd);
  const day = String(d.getDate()).padStart(2, '0');
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const y = d.getFullYear();
  return `${day}-${m}-${y}`;
}

function parseValorBrouPizarra(raw: string): number {
  const t = raw.trim();
  if (!t || t === '-') return NaN;
  const lc = t.lastIndexOf(',');
  const ld = t.lastIndexOf('.');
  let norm: string;
  if (lc !== -1 && ld !== -1) {
    norm = lc > ld ? t.replace(/\./g, '').replace(',', '.') : t.replace(/,/g, '');
  } else if (lc !== -1) {
    norm = t.replace(/\./g, '').replace(',', '.');
  } else {
    norm = t.replace(/,/g, '');
  }
  const n = Number(norm);
  return Number.isFinite(n) && n > 0 ? n : NaN;
}

/**
 * Extrae compra del primer renglón "Dólar" (no "Dólar eBROU") del HTML del portlet BROU.
 */
export function extraerDolarCompraBrouHtml(html: string): number | null {
  const idx = html.indexOf('<p class="moneda">Dólar</p>');
  if (idx === -1) return null;
  const slice = html.slice(idx, idx + 2500);
  const m = slice.match(/<p class="valor">\s*([^<]+?)\s*<\/p>/);
  if (!m?.[1]) return null;
  const n = parseValorBrouPizarra(m[1]);
  return Number.isFinite(n) ? n : null;
}

export async function fetchDolarCompraBrou(): Promise<number> {
  const res = await fetch(BROU_COTIZACIONES_PORTLET, {
    headers: { 'User-Agent': CHROME_UA },
    signal: AbortSignal.timeout(25_000),
  });
  if (!res.ok) {
    throw new Error(`BROU HTTP ${res.status}`);
  }
  const html = await res.text();
  const v = extraerDolarCompraBrouHtml(html);
  if (v == null) {
    throw new Error('No se pudo leer la cotización de compra del dólar en el HTML del BROU.');
  }
  return v;
}

/**
 * Descarga el xlsx del INE con `https`/`http` nativos.
 * @param verificarTls Si es false, no se valida la cadena del certificado (workaround frecuente con www5.ine.gub.uy).
 */
function descargarIneConNodeHttp(urlString: string, maxRedirects = 10, verificarTls = true): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const attempt = (currentUrl: string, redirects: number) => {
      if (redirects > maxRedirects) {
        reject(new Error('demasiadas redirecciones'));
        return;
      }
      const url = new NodeURL(currentUrl);
      const isHttps = url.protocol === 'https:';
      const lib = isHttps ? https : http;
      const req = lib.request(
        {
          hostname: url.hostname,
          port: url.port || (isHttps ? 443 : 80),
          path: url.pathname + url.search,
          method: 'GET',
          headers: {
            'User-Agent': CHROME_UA,
            Accept:
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/octet-stream,*/*',
            'Accept-Language': 'es-UY,es;q=0.9',
            Connection: 'close',
          },
          timeout: 90_000,
          ...(isHttps ? { rejectUnauthorized: verificarTls } : {}),
        },
        (res) => {
          const code = res.statusCode ?? 0;
          if (code >= 300 && code < 400 && res.headers.location) {
            const next = new NodeURL(res.headers.location, currentUrl).href;
            res.resume();
            attempt(next, redirects + 1);
            return;
          }
          if (code !== 200) {
            res.resume();
            reject(new Error(`HTTP ${code}`));
            return;
          }
          const chunks: Buffer[] = [];
          res.on('data', (chunk: Buffer) => chunks.push(chunk));
          res.on('end', () => resolve(Buffer.concat(chunks)));
          res.on('error', reject);
        }
      );
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('timeout'));
      });
      req.end();
    };
    attempt(urlString, 0);
  });
}

async function descargarXlsxIne(): Promise<Buffer> {
  const fallos: string[] = [];

  for (const [etiqueta, verificarTls] of [
    ['https (validación TLS normal)', true],
    ['https (sin validar cadena; www5.ine.gub.uy suele enviar cadena incompleta)', false],
  ] as const) {
    try {
      const buf = await descargarIneConNodeHttp(INE_XLSX_HREF, 10, verificarTls);
      if (buf.length >= 5000) {
        return buf;
      }
      fallos.push(`${etiqueta}: respuesta corta (${buf.length} bytes)`);
    } catch (e) {
      fallos.push(`${etiqueta}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  throw new Error(`No se pudo descargar el Excel del INE. ${fallos.join(' | ')}`);
}

function numeroIneValido(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v) && v > 0;
}

async function cargarMapaDolarIne(): Promise<Map<string, number>> {
  if (ineCache && Date.now() - ineCache.loadedAt < INE_MAP_CACHE_MS) {
    return ineCache.map;
  }
  const buf = await descargarXlsxIne();
  const wb = XLSX.read(buf, { type: 'buffer' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });
  const map = new Map<string, number>();
  for (const row of rows) {
    const fecha = row[COL_FECHA];
    const compra = row[COL_DOLAR_COMPRA];
    if (typeof fecha !== 'string') continue;
    const key = fecha.trim();
    if (!key || key === '..') continue;
    if (!numeroIneValido(compra)) continue;
    map.set(key, compra);
  }
  ineCache = { map, loadedAt: Date.now() };
  return map;
}

/**
 * Busca Dólar USA compra (INE, cotización al público) para la fecha objetivo o días hábiles anteriores.
 */
export async function dolarCompraIneConFallback(fechaObjetivoYmd: string, maxRetroceso = 15): Promise<{
  valor: number;
  fechaUsadaYmd: string;
}> {
  const map = await cargarMapaDolarIne();
  const base = parseDateLocal(fechaObjetivoYmd);
  for (let i = 0; i < maxRetroceso; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() - i);
    const ymd = formatDateLocal(d);
    const claveIne = fechaIsoAUyIne(ymd);
    const v = map.get(claveIne);
    if (v != null) {
      return { valor: v, fechaUsadaYmd: ymd };
    }
  }
  throw new Error(
    `No hay cotización Dólar USA compra en el archivo del INE para ${fechaObjetivoYmd} ni ${maxRetroceso} días anteriores.`
  );
}

export type ResultadoDolarDiaHabilAnterior = {
  valor: number;
  fechaUsadaYmd: string;
  fuenteDolar: 'ine' | 'brou';
  nota?: string;
};

/**
 * Dólar compra (INE, al público) para el **día hábil anterior al acto** (`fDolarStr`).
 * Si el INE no está disponible y ese día es **hoy**, último recurso: pizarra BROU.
 */
export async function obtenerDolarDiaHabilAnterior(fDolarStr: string): Promise<ResultadoDolarDiaHabilAnterior> {
  const hoyStr = formatDateLocal(new Date());
  try {
    const r = await dolarCompraIneConFallback(fDolarStr);
    return { valor: r.valor, fechaUsadaYmd: r.fechaUsadaYmd, fuenteDolar: 'ine' };
  } catch (ineErr) {
    const ineMsg = ineErr instanceof Error ? ineErr.message : String(ineErr);
    if (fDolarStr !== hoyStr) {
      throw new Error(`INE (día hábil anterior al acto = ${fDolarStr}): ${ineMsg}`);
    }
    try {
      const v = await fetchDolarCompraBrou();
      return {
        valor: v,
        fechaUsadaYmd: fDolarStr,
        fuenteDolar: 'brou',
        nota:
          'El INE no respondió; se usó la pizarra BROU del momento. El día hábil anterior al acto es hoy, por lo que la pizarra vigente coincide con ese criterio.',
      };
    } catch (brouErr) {
      const brouMsg = brouErr instanceof Error ? brouErr.message : String(brouErr);
      throw new Error(`INE: ${ineMsg} | BROU: ${brouMsg}`);
    }
  }
}
