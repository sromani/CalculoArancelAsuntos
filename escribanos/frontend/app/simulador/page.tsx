'use client';

import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import { datosPorCapitulo } from '@/lib/arancel/data';
import {
  calcularHonorario,
  reglaRequiereEntradaMontos,
  resolverClaveRegla,
  type ResultadoCalculo,
  type ValoresForm,
} from '@/lib/arancel/compute';
import type { DetalleSpec, Regla } from '@/lib/arancel/types';
import type { CotizacionesSimulador } from '@/lib/bcu-cotizaciones';
import { formatDateLocal } from '@/lib/bcu-cotizaciones';
import type { MonedaEntrada } from '@/lib/arancel/conversion';
import { OPCIONES_MONEDA_FORM } from '@/lib/arancel/conversion';
import type { CapituloIData } from '@/lib/arancel/types';

const CAPITULOS = [
  { id: 'actos-contratos', label: 'Actos y Contratos', disponible: true },
  { id: 'certificaciones', label: 'Certificaciones', disponible: true },
  { id: 'actas-protocolizaciones', label: 'Actas y Protocolizaciones', disponible: true },
] as const;

const OPCIONES_PLAZO_USUFRUCTO = [
  { value: '', label: 'Tipo de plazo del usufructo', disabled: true },
  { value: 'contractual', label: 'Plazo contractual (hasta 70 años)' },
  { value: 'vitalicio', label: 'Vitalicio (según edad del menor usufructuario)' },
];

function etiquetaCampoPrincipal(m: MonedaEntrada): string {
  switch (m) {
    case 'USD':
      return 'USD';
    case 'UYU':
      return 'pesos uruguayos ($)';
    case 'UI':
      return 'UI';
    case 'UR':
      return 'UR (cotización semestral)';
    default:
      return m;
  }
}

function CamposValorBase({
  spec,
  valores,
  monedaPrincipal,
  regla,
  onChange,
}: {
  spec: DetalleSpec;
  valores: ValoresForm;
  monedaPrincipal: MonedaEntrada;
  regla?: Regla;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}) {
  const ep = etiquetaCampoPrincipal(monedaPrincipal);
  const tablaU = regla?.tablaUsufructo;
  const literal =
    tablaU === 'uso'
      ? 'Uso sobre inmueble (50% del valor proporcional del usufructo según tabla).'
      : 'Usufructo sobre inmueble (valor proporcional según tabla).';

  switch (spec.kind) {
    case 'max_partes_catastral':
      return (
        <>
          <div className="form-grid">
            <Input
              label={`Valor asignado por las partes (${ep})`}
              name="valorPartes"
              type="text"
              value={valores.valorPartes ?? ''}
              onChange={onChange}
              placeholder="0"
            />
            <Input
              label="Valor real total del inmueble — catastral u oficial ($)"
              name="valorCatastral"
              type="text"
              value={valores.valorCatastral ?? ''}
              onChange={onChange}
              placeholder="0"
            />
          </div>
          {tablaU && (
            <div className="form-field" style={{ marginTop: '1rem' }}>
              <span className="form-hint" style={{ display: 'block', marginBottom: '0.75rem' }}>
                {literal} Para armar la tabla se usa el <strong>mayor</strong> entre valor de partes (en pesos) y valor real/catastral del inmueble. El porcentaje del arancel se aplica <strong>solo</strong> sobre el valor del usufructo (o del uso) que resulta de esa tabla.
              </span>
              <Select
                label="Plazo del derecho"
                name="usufructoTipoPlazo"
                value={valores.usufructoTipoPlazo ?? ''}
                onChange={onChange}
                options={OPCIONES_PLAZO_USUFRUCTO}
                required
              />
              {valores.usufructoTipoPlazo === 'contractual' && (
                <Input
                  label="Años de plazo contractual (1 a 70)"
                  name="usufructoAniosContrato"
                  type="text"
                  inputMode="numeric"
                  value={valores.usufructoAniosContrato ?? ''}
                  onChange={onChange}
                  placeholder="Ej: 20"
                />
              )}
              {valores.usufructoTipoPlazo === 'vitalicio' && (
                <Input
                  label="Edad del menor de los usufructuarios"
                  name="usufructoEdadMenor"
                  type="text"
                  inputMode="numeric"
                  value={valores.usufructoEdadMenor ?? ''}
                  onChange={onChange}
                  placeholder="Años"
                />
              )}
            </div>
          )}
        </>
      );
    case 'solo_partes':
      return (
        <Input
          label={`Valor asignado por las partes (${ep})`}
          name="valorPartes"
          type="text"
          value={valores.valorPartes ?? ''}
          onChange={onChange}
          placeholder="0"
        />
      );
    case 'capital_social':
      return (
        <Input
          label={`Capital social (${ep})`}
          name="capitalSocial"
          type="text"
          value={valores.capitalSocial ?? ''}
          onChange={onChange}
          placeholder="0"
        />
      );
    case 'aumento_capital':
      return (
        <Input
          label={`Aumento de capital (${ep})`}
          name="aumentoCapital"
          type="text"
          value={valores.aumentoCapital ?? ''}
          onChange={onChange}
          placeholder="0"
        />
      );
    case 'aumento_precio':
      return (
        <Input
          label={`Aumento de precio (${ep})`}
          name="aumentoPrecio"
          type="text"
          value={valores.aumentoPrecio ?? ''}
          onChange={onChange}
          placeholder="0"
        />
      );
    case 'importe_pagos_periodicos':
      return (
        <div className="form-field">
          <Input
            label={`Importe total de pagos periódicos en el plazo convenido (${ep})`}
            name="importePagos"
            type="text"
            value={valores.importePagos ?? ''}
            onChange={onChange}
            placeholder="0"
          />
          {spec.conTopeUr500 ? (
            <span className="form-hint">
              Según arancel: no menor a un año; puede existir tope de 500 UR (verificar texto del arancel).
            </span>
          ) : (
            <span className="form-hint">Según arancel: no menor a un año.</span>
          )}
        </div>
      );
    case 'generico':
      return (
        <div className="form-field">
          <Input
            label={`Valor base (${ep})`}
            name="valorGenerico"
            type="text"
            value={valores.valorGenerico ?? ''}
            onChange={onChange}
            placeholder="0"
          />
          <span className="form-hint">{spec.textoOriginal}</span>
        </div>
      );
    case 'testimonio_fojas':
      return (
        <Input
          label="Número de fojas"
          name="numeroFojas"
          type="text"
          inputMode="numeric"
          value={valores.numeroFojas ?? ''}
          onChange={onChange}
          placeholder="1"
        />
      );
    case 'sin_detalle_pct':
    case 'fijo_sin_entrada':
      return null;
    default:
      return null;
  }
}

export default function SimuladorPage() {
  const [capituloId, setCapituloId] = useState<string>('');
  const [posDocStr, setPosDocStr] = useState('');
  const [posBienStr, setPosBienStr] = useState('');
  const [valores, setValores] = useState<ValoresForm>({});
  const [resultado, setResultado] = useState<ResultadoCalculo | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [fechaFirma, setFechaFirma] = useState<string>('');
  const [monedaPrincipal, setMonedaPrincipal] = useState<MonedaEntrada>('USD');
  const [cotizaciones, setCotizaciones] = useState<CotizacionesSimulador | null>(null);
  const [cotizacionesError, setCotizacionesError] = useState<string | null>(null);
  const [cotizacionesCargando, setCotizacionesCargando] = useState(false);

  const data: CapituloIData | null = useMemo(() => {
    if (capituloId === 'actos-contratos') return datosPorCapitulo['actos-contratos'];
    if (capituloId === 'certificaciones') return datosPorCapitulo.certificaciones;
    if (capituloId === 'actas-protocolizaciones') return datosPorCapitulo['actas-protocolizaciones'];
    return null;
  }, [capituloId]);

  const cargarCotizaciones = useCallback(async (fecha: string) => {
    setCotizacionesCargando(true);
    setCotizacionesError(null);
    try {
      const res = await fetch(`/api/cotizaciones-bcu?fecha=${encodeURIComponent(fecha)}`);
      const json = await res.json();
      if (!res.ok) {
        setCotizaciones(null);
        setCotizacionesError(json.detalle ? `${json.error} (${json.detalle})` : json.error ?? 'Error al cargar cotizaciones');
        return;
      }
      setCotizaciones(json as CotizacionesSimulador);
    } catch {
      setCotizaciones(null);
      setCotizacionesError('No se pudo conectar con el servidor para obtener cotizaciones.');
    } finally {
      setCotizacionesCargando(false);
    }
  }, []);

  useEffect(() => {
    setFechaFirma(formatDateLocal(new Date()));
  }, []);

  useEffect(() => {
    if (!fechaFirma) return;
    void cargarCotizaciones(fechaFirma);
  }, [fechaFirma, cargarCotizaciones]);

  const documentoSel = useMemo(() => {
    if (!data) return undefined;
    const pd = parseInt(posDocStr, 10);
    if (!Number.isFinite(pd)) return undefined;
    return data.documentos.find((d) => d.posDoc === pd);
  }, [posDocStr, data]);

  const posBienNum = posBienStr ? parseInt(posBienStr, 10) : null;

  const posBienEfectivo = useMemo(() => {
    if (!documentoSel?.tieneSeleccionBien) return null;
    if (documentoSel.opcionesBien.length === 1) {
      return documentoSel.opcionesBien[0].posBien;
    }
    return Number.isFinite(posBienNum ?? NaN) ? posBienNum : null;
  }, [documentoSel, posBienNum]);

  const regla: Regla | undefined = useMemo(() => {
    if (!data || !documentoSel) return undefined;
    if (capituloId === 'certificaciones' || capituloId === 'actas-protocolizaciones') {
      return data.reglas[String(documentoSel.posDoc)];
    }
    if (capituloId === 'actos-contratos') {
      const key = resolverClaveRegla(
        documentoSel.posDoc,
        posBienEfectivo,
        documentoSel.tieneSeleccionBien
      );
      if (!key) return undefined;
      return data.reglas[key];
    }
    return undefined;
  }, [capituloId, data, documentoSel, posBienEfectivo]);

  useEffect(() => {
    if (capituloId !== 'actos-contratos') return;
    const pd = parseInt(posDocStr, 10);
    if (!Number.isFinite(pd)) {
      setPosBienStr('');
      return;
    }
    const doc = data?.documentos.find((d) => d.posDoc === pd);
    if (!doc) return;
    if (!doc.tieneSeleccionBien || doc.opcionesBien.length === 0) {
      setPosBienStr('');
      return;
    }
    if (doc.opcionesBien.length === 1) {
      setPosBienStr(String(doc.opcionesBien[0].posBien));
      return;
    }
    const current = parseInt(posBienStr, 10);
    const ok = doc.opcionesBien.some((o) => o.posBien === current);
    if (!ok) setPosBienStr('');
  }, [capituloId, posDocStr, data, posBienStr]);

  useEffect(() => {
    setValores({});
    setResultado(null);
    setErrorMsg(null);
  }, [regla?.articulo, regla?.honorarioParsed]);

  const handleCapitulo = (e: ChangeEvent<HTMLSelectElement>) => {
    setCapituloId(e.target.value);
    setPosDocStr('');
    setPosBienStr('');
    setValores({});
    setResultado(null);
    setErrorMsg(null);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'capitulo') {
      handleCapitulo(e as ChangeEvent<HTMLSelectElement>);
      return;
    }
    if (name === 'posDoc') {
      setPosDocStr(value);
      setPosBienStr('');
      setValores({});
      setResultado(null);
      setErrorMsg(null);
      return;
    }
    if (name === 'posBien') {
      setPosBienStr(value);
      setValores({});
      setResultado(null);
      setErrorMsg(null);
      return;
    }
    if (name === 'fechaFirma') {
      setFechaFirma(value);
      setResultado(null);
      setErrorMsg(null);
      return;
    }
    if (name === 'monedaPrincipal') {
      setMonedaPrincipal(value as MonedaEntrada);
      setResultado(null);
      setErrorMsg(null);
      return;
    }
    if (
      name === 'usufructoTipoPlazo' ||
      name === 'usufructoAniosContrato' ||
      name === 'usufructoEdadMenor'
    ) {
      setValores((prev) => ({ ...prev, [name]: value }));
      setResultado(null);
      setErrorMsg(null);
      return;
    }
    setValores((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setResultado(null);
    if (!regla) {
      setErrorMsg('Completá capítulo, documento y tipo de bien si corresponde.');
      return;
    }
    if (!cotizaciones) {
      setErrorMsg('Esperá a que carguen las cotizaciones del BCU o revisá la fecha del documento.');
      return;
    }
    const ctx = {
      monedaPrincipal,
      tasas: {
        dolarComprador: cotizaciones.dolarComprador,
        uiPesos: cotizaciones.uiPesos,
        urSemestralPesos: cotizaciones.urSemestralPesos,
      },
    };
    const out = calcularHonorario(regla, valores, ctx);
    if ('error' in out) {
      setErrorMsg(out.error);
      return;
    }
    setResultado(out);
  };

  const docOptions =
    data?.documentos.map((d) => ({
      value: String(d.posDoc),
      label: d.nombre,
    })) ?? [];

  const bienOptions =
    documentoSel?.opcionesBien.map((b) => ({
      value: String(b.posBien),
      label: b.etiqueta,
    })) ?? [];

  const muestraPasoBien =
    capituloId === 'actos-contratos' &&
    documentoSel?.tieneSeleccionBien &&
    documentoSel.opcionesBien.length > 1;

  const seleccionCompleta =
    !!data &&
    !!documentoSel &&
    (capituloId === 'certificaciones' ||
      capituloId === 'actas-protocolizaciones' ||
      (capituloId === 'actos-contratos' &&
        (!documentoSel.tieneSeleccionBien ||
          documentoSel.opcionesBien.length === 0 ||
          posBienEfectivo != null)));

  const tipoH = regla?.honorarioParsed.tipo;
  const muestraBloqueCotizaciones =
    seleccionCompleta && regla && tipoH !== 'desconocido';

  const muestraValoresFormulario = regla ? reglaRequiereEntradaMontos(regla) : false;

  const textoBoton =
    tipoH === 'ur_fijo' ? 'Ver honorario' : 'Calcular honorario';

  return (
    <div className="simulador-container">
      <div className="simulador-content">
        <div className="simulador-header">
          <h1>Simulador de Arancel Notarial</h1>
        </div>

        <form onSubmit={handleSubmit} className="simulador-form">
          <div className="form-section">
            <h2>Paso 1: Capítulo</h2>
            <Select
              label="Elegí el capítulo"
              name="capitulo"
              value={capituloId}
              onChange={handleChange}
              options={CAPITULOS.map((c) => ({
                value: c.id,
                label: c.disponible ? c.label : `${c.label} (próximamente)`,
                disabled: !c.disponible,
              }))}
              placeholder="Seleccioná un capítulo"
              required
            />
          </div>

          {data && (
            <>
              <hr className="form-divider" />
              <div className="form-section">
                <h2>Paso 2: Documento</h2>
                <Select
                  label="Documento"
                  name="posDoc"
                  value={posDocStr}
                  onChange={handleChange}
                  options={docOptions}
                  placeholder="Seleccioná el documento"
                  required
                />
              </div>
            </>
          )}

          {muestraPasoBien && (
            <>
              <hr className="form-divider" />
              <div className="form-section">
                <h2>Paso 3: Tipo de bien</h2>
                <Select
                  label="Tipo de bien"
                  name="posBien"
                  value={posBienStr}
                  onChange={handleChange}
                  options={bienOptions}
                  placeholder="Seleccioná el bien"
                  required
                />
              </div>
            </>
          )}

          {capituloId === 'actos-contratos' &&
            documentoSel?.tieneSeleccionBien &&
            documentoSel.opcionesBien.length === 1 && (
              <p className="form-hint" style={{ marginTop: '-0.5rem', marginBottom: '1rem' }}>
                Tipo de bien aplicable: <strong>{documentoSel.opcionesBien[0].etiqueta}</strong>
              </p>
            )}

          {seleccionCompleta && regla && (
            <>
              <hr className="form-divider" />
              <div className="form-section">
                <h2>Artículo aplicable</h2>
                <div className="form-note">
                  <p>
                    <strong>{regla.articulo}</strong>
                  </p>
                  <p className="form-hint" style={{ marginTop: '0.5rem' }}>
                    Honorario previsto en tabla: <strong>{regla.honorarioParsed.raw}</strong>
                  </p>
                </div>
              </div>
            </>
          )}

          {muestraBloqueCotizaciones && (
            <>
              <hr className="form-divider" />
              <div className="form-section">
                <h2>Fecha del documento y moneda</h2>
                <div className="form-grid form-grid--align-end">
                  <Input
                    label="Fecha del acto / firma"
                    name="fechaFirma"
                    type="date"
                    value={fechaFirma}
                    onChange={handleChange}
                    required
                  />
                  <Select
                    label="Moneda de los montos o de visualización"
                    name="monedaPrincipal"
                    value={monedaPrincipal}
                    onChange={handleChange}
                    options={[...OPCIONES_MONEDA_FORM]}
                    required
                  />
                </div>
                {cotizacionesCargando && (
                  <p className="form-hint">Consultando cotizaciones del BCU…</p>
                )}
                {cotizacionesError && (
                  <div className="form-note" style={{ borderColor: '#fecaca', background: '#fef2f2' }}>
                    <p style={{ color: '#991b1b' }}>{cotizacionesError}</p>
                  </div>
                )}
                {cotizaciones && !cotizacionesCargando && (
                  <div className="form-note" style={{ marginTop: '1rem' }}>
                    <p className="form-hint" style={{ marginBottom: '0.5rem' }}>
                      <strong>Cotizaciones usadas</strong> (BCU WSCotizaciones)
                    </p>
                    <ul className="form-hint" style={{ paddingLeft: '1.25rem', lineHeight: 1.6 }}>
                      <li>
                        Dólar USA billete <strong>compra</strong>: {cotizaciones.dolarComprador.toLocaleString('es-UY')} $ —{' '}
                        {cotizaciones.fechaDolarCompra} (día hábil anterior al acto; sin feriados).
                      </li>
                      <li>
                        UI: {cotizaciones.uiPesos.toLocaleString('es-UY')} $ — {cotizaciones.fechaConsultaUiUr}.
                      </li>
                      <li>
                        UR mes (referencia): {cotizaciones.urMensualPesos.toLocaleString('es-UY')} $.
                      </li>
                      <li>
                        UR <strong>semestral</strong>: {cotizaciones.urSemestralPesos.toLocaleString('es-UY')} $ — ref.{' '}
                        {cotizaciones.fechaReferenciaUrSemestral}.
                      </li>
                    </ul>
                  </div>
                )}

                {muestraValoresFormulario && regla && (
                  <>
                    <h2 style={{ marginTop: '2rem' }}>Valores para el cálculo</h2>
                    {regla.detalleValorBase ? (
                      <p className="form-hint" style={{ marginBottom: '1rem' }}>
                        Tabla: {regla.detalleValorBase}
                      </p>
                    ) : null}
                    <CamposValorBase
                      spec={regla.detalleSpec}
                      valores={valores}
                      monedaPrincipal={monedaPrincipal}
                      regla={regla}
                      onChange={handleChange}
                    />
                  </>
                )}
              </div>
            </>
          )}

          {errorMsg && (
            <div className="form-note" style={{ borderColor: '#fecaca', background: '#fef2f2' }}>
              <p style={{ color: '#991b1b' }}>{errorMsg}</p>
            </div>
          )}

          {resultado && (
            <div className="form-note" style={{ background: 'var(--fondo-verde-claro)', borderColor: 'var(--verde-principal)' }}>
              <h3 style={{ color: 'var(--verde-titulo)', marginBottom: '0.75rem' }}>Resultado</h3>
              <p>
                <strong>Artículo:</strong> {resultado.articulo}
              </p>
              {resultado.tipo === 'ur_fijo' ? (
                <>
                  <p style={{ marginTop: '0.5rem', fontSize: '1.15rem' }}>
                    Honorario: <strong>{resultado.textoHonorario}</strong>
                    {resultado.periodo ? ` (${resultado.periodo})` : ''}
                  </p>
                  {resultado.monedaPrincipal !== 'UYU' ? (
                    <>
                      <p style={{ marginTop: '0.75rem', fontSize: '1.25rem' }}>
                        Equivalente en moneda elegida: <strong>{resultado.honorarioPrincipalFormateado}</strong>
                      </p>
                      <p style={{ marginTop: '0.5rem' }}>
                        Equivalente en pesos uruguayos: <strong>$ {resultado.honorarioPesosFormateado}</strong>
                      </p>
                    </>
                  ) : (
                    <p style={{ marginTop: '0.75rem', fontSize: '1.25rem' }}>
                      En pesos uruguayos: <strong>$ {resultado.honorarioPesosFormateado}</strong>
                    </p>
                  )}
                </>
              ) : resultado.tipo === 'monto_simple' ? (
                <>
                  <p className="form-hint" style={{ marginTop: '0.75rem' }}>
                    {resultado.formulaDescripcion}
                  </p>
                  <p style={{ marginTop: '0.75rem', fontSize: '1.35rem', color: 'var(--verde-oscuro)' }}>
                    Honorario: <strong>{resultado.honorarioPrincipalFormateado}</strong>
                  </p>
                  {resultado.monedaPrincipal !== 'UYU' && (
                    <p style={{ marginTop: '0.5rem' }}>
                      Equivalente en pesos uruguayos: <strong>$ {resultado.honorarioPesosFormateado}</strong>
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p style={{ marginTop: '0.5rem' }}>
                    {resultado.porcentajeTexto} sobre base en pesos: {resultado.baseDescripcion}
                  </p>
                  <p style={{ marginTop: '0.75rem', fontSize: '1.35rem', color: 'var(--verde-oscuro)' }}>
                    Honorario estimado: <strong>{resultado.montoPrincipalFormateado}</strong>
                  </p>
                  {resultado.monedaPrincipal !== 'UYU' && (
                    <p style={{ marginTop: '0.5rem' }}>
                      Equivalente en pesos uruguayos: <strong>$ {resultado.montoPesosFormateado}</strong>
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {seleccionCompleta && (
            <div className="form-actions">
              <Button type="submit" variant="primary" disabled={cotizacionesCargando || !cotizaciones}>
                {textoBoton}
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
