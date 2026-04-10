'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import ActoSearchCombobox from '../components/ui/ActoSearchCombobox';
import { datosPorCapitulo } from '@/lib/arancel/data';
import { listaActosSimuladorOrdenada, parseActoKey } from '@/lib/arancel/actos-simulador';
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
import {
  formatoHonorarioEntero,
  OPCIONES_MONEDA_FORM,
  type MonedaEntrada,
  type TasasLineas,
} from '@/lib/arancel/conversion';
import type { CapituloIData } from '@/lib/arancel/types';
import {
  calcularDesgloseLiquido,
  calcularDesgloseLiquidoConAportesArancel,
  formatearMontoEnMoneda,
  honorarioEnPrincipal,
  parseHonorarioACobrarInput,
  type LineasDesgloseLiquido,
} from '@/lib/arancel/liquido-escribano';

const OPCIONES_PLAZO_USUFRUCTO = [
  { value: '', label: 'Tipo de plazo del usufructo', disabled: true },
  { value: 'contractual', label: 'Plazo contractual (hasta 70 años)' },
  { value: 'vitalicio', label: 'Vitalicio (según edad del menor usufructuario)' },
];

const OPCIONES_FONASA_SIM = [
  { value: '4.5', label: '4,5 %' },
  { value: '6', label: '6 %' },
  { value: '8', label: '8 %' },
];

const OPCIONES_IRPF_SIM = [0, 10, 15, 24, 25, 27, 31, 36].map((n) => ({
  value: String(n),
  label: `${n} %`,
}));

const TEXTO_LEYENDA_IRPF =
  'El IRPF es un impuesto personal que se calcula sobre la renta de cada mes y admite deducciones y datos particulares que este simulador no puede conocer; los anticipos se liquidan en forma bimestral. El porcentaje que elijas se aplica aquí sobre una base convencional solo como referencia: elegí la opción que mejor se aproxime a tu situación.';

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

function bloqueFacturaDesglose(
  lineas: LineasDesgloseLiquido,
  moneda: MonedaEntrada,
  etiquetaHonorario: string = 'Honorarios arancel'
) {
  const fmt = (n: number) => formatearMontoEnMoneda(n, moneda);
  return (
    <div className="simulador-desglose-bloque-interno">
      <p className="simulador-desglose-sub">Factura</p>
      <div className="simulador-desglose-row">
        <span>{etiquetaHonorario}</span>
        <strong>{fmt(lineas.honorario)}</strong>
      </div>
      <div className="simulador-desglose-row">
        <span>IVA (22 %)</span>
        <strong>{fmt(lineas.iva)}</strong>
      </div>
      <div className="simulador-desglose-row simulador-desglose-total">
        <span>Total</span>
        <strong>{fmt(lineas.totalFactura)}</strong>
      </div>
    </div>
  );
}

function bloqueAportesDesglose(lineas: LineasDesgloseLiquido, moneda: MonedaEntrada) {
  const fmt = (n: number) => formatearMontoEnMoneda(n, moneda);
  return (
    <div className="simulador-desglose-bloque-interno">
      <p className="simulador-desglose-sub">Aportes a Caja Notarial</p>
      <div className="simulador-desglose-row">
        <span>Montepío notarial (19 %)</span>
        <strong>{fmt(lineas.montepio)}</strong>
      </div>
      <div className="simulador-desglose-row">
        <span>Fondo gremial</span>
        <strong>{fmt(lineas.fondoGremial)}</strong>
      </div>
      <div className="simulador-desglose-row simulador-desglose-total">
        <span>Total</span>
        <strong>{fmt(lineas.totalAportes)}</strong>
      </div>
    </div>
  );
}

/** IRPF y Fonasa arriba; total abajo (después de los desplegables en el padre). */
function bloqueValoresGastosDesglose(lineas: LineasDesgloseLiquido, moneda: MonedaEntrada) {
  const fmt = (n: number) => formatearMontoEnMoneda(n, moneda);
  return (
    <>
      <div className="simulador-desglose-row">
        <span>IRPF (estimado)</span>
        <strong>{fmt(lineas.irpf)}</strong>
      </div>
      <div className="simulador-desglose-row">
        <span>Fonasa</span>
        <strong>{fmt(lineas.fonasa)}</strong>
      </div>
    </>
  );
}

function bloqueTotalGastosDesglose(lineas: LineasDesgloseLiquido, moneda: MonedaEntrada) {
  const fmt = (n: number) => formatearMontoEnMoneda(n, moneda);
  return (
    <div className="simulador-desglose-row simulador-desglose-total">
      <span>Total</span>
      <strong>{fmt(lineas.totalGastos)}</strong>
    </div>
  );
}

function bloqueLiquidoDesglose(lineas: LineasDesgloseLiquido, moneda: MonedaEntrada) {
  const fmt = (n: number) => formatearMontoEnMoneda(n, moneda);
  return (
    <div className="simulador-desglose-bloque-interno">
      <p className="simulador-desglose-sub">Líquido</p>
      <div className="simulador-desglose-row simulador-desglose-total">
        <span>Líquido final</span>
        <strong>{fmt(lineas.liquido)}</strong>
      </div>
    </div>
  );
}

export default function SimuladorPage() {
  const [actoKey, setActoKey] = useState('');
  const [posBienStr, setPosBienStr] = useState('');
  const [valores, setValores] = useState<ValoresForm>({});
  const [resultado, setResultado] = useState<ResultadoCalculo | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [fechaFirma, setFechaFirma] = useState<string>('');
  const [monedaPrincipal, setMonedaPrincipal] = useState<MonedaEntrada>('USD');
  const [cotizaciones, setCotizaciones] = useState<CotizacionesSimulador | null>(null);
  const [cotizacionesError, setCotizacionesError] = useState<string | null>(null);
  const [cotizacionesCargando, setCotizacionesCargando] = useState(false);

  const [fonasaPctStr, setFonasaPctStr] = useState('4.5');
  const [irpfPctStr, setIrpfPctStr] = useState('0');
  const [honorarioAlternativoStr, setHonorarioAlternativoStr] = useState('');

  const actoParsed = useMemo(() => parseActoKey(actoKey), [actoKey]);
  const capituloId = actoParsed?.capituloId ?? '';

  const data: CapituloIData | null = useMemo(() => {
    if (!actoParsed) return null;
    return datosPorCapitulo[actoParsed.capituloId];
  }, [actoParsed]);

  const posDocStr = actoParsed ? String(actoParsed.posDoc) : '';

  const opcionesActo = useMemo(
    () =>
      listaActosSimuladorOrdenada().map((a) => ({
        value: a.key,
        label: a.nombre,
      })),
    []
  );

  const cargarCotizaciones = useCallback(async (fecha: string) => {
    setCotizacionesCargando(true);
    setCotizacionesError(null);
    try {
      const res = await fetch(`/api/cotizaciones-bcu?fecha=${encodeURIComponent(fecha)}`);
      const json = await res.json();
      if (!res.ok) {
        setCotizaciones(null);
        const partes: string[] = [String(json.error ?? 'Error al cargar cotizaciones')];
        if (typeof json.paso === 'string') partes.push(`[${json.paso}]`);
        if (json.detalle) partes.push(String(json.detalle));
        setCotizacionesError(partes.join(' '));
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
    const hoy = formatDateLocal(new Date());
    if (fechaFirma > hoy) {
      setCotizaciones(null);
      setCotizacionesCargando(false);
      setCotizacionesError('La fecha del acto no puede ser posterior a hoy.');
      return;
    }
    void cargarCotizaciones(fechaFirma);
  }, [fechaFirma, cargarCotizaciones]);

  const tasasCalculo: TasasLineas | null = useMemo(() => {
    if (!cotizaciones) return null;
    return {
      dolarComprador: cotizaciones.dolarComprador,
      uiPesos: cotizaciones.uiPesos,
      urSemestralPesos: cotizaciones.urSemestralPesos,
    };
  }, [cotizaciones]);

  useEffect(() => {
    if (!resultado || !tasasCalculo) return;
    const hp = honorarioEnPrincipal(resultado, tasasCalculo);
    setHonorarioAlternativoStr(formatoHonorarioEntero(hp));
  }, [resultado, tasasCalculo]);

  const fonasaPctNum = Number(fonasaPctStr);
  const irpfPctNum = Number(irpfPctStr);
  const pctOk =
    ['4.5', '6', '8'].includes(fonasaPctStr) &&
    [0, 10, 15, 24, 25, 27, 31, 36].includes(irpfPctNum);

  const lineasArancelColumna = useMemo(() => {
    if (!resultado || !tasasCalculo || !pctOk) return null;
    const h = honorarioEnPrincipal(resultado, tasasCalculo);
    return calcularDesgloseLiquido(
      h,
      resultado.monedaPrincipal,
      tasasCalculo,
      fonasaPctNum,
      irpfPctNum
    );
  }, [resultado, tasasCalculo, pctOk, fonasaPctNum, irpfPctNum]);

  const honorarioAltValor = parseHonorarioACobrarInput(honorarioAlternativoStr);

  const lineasAltColumna = useMemo(() => {
    if (
      !resultado ||
      !tasasCalculo ||
      !pctOk ||
      honorarioAltValor === null ||
      !lineasArancelColumna
    ) {
      return null;
    }
    return calcularDesgloseLiquidoConAportesArancel(
      honorarioAltValor,
      {
        montepio: lineasArancelColumna.montepio,
        fondoGremial: lineasArancelColumna.fondoGremial,
        fondoReconversionLaboral: lineasArancelColumna.fondoReconversionLaboral,
        totalAportes: lineasArancelColumna.totalAportes,
      },
      resultado.monedaPrincipal,
      tasasCalculo,
      fonasaPctNum,
      irpfPctNum
    );
  }, [
    resultado,
    tasasCalculo,
    pctOk,
    honorarioAltValor,
    lineasArancelColumna,
    fonasaPctNum,
    irpfPctNum,
  ]);

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

  const handleActoKey = useCallback((key: string) => {
    setActoKey(key);
    setPosBienStr('');
    setValores({});
    setResultado(null);
    setErrorMsg(null);
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'posBien') {
      setPosBienStr(value);
      setValores({});
      setResultado(null);
      setErrorMsg(null);
      return;
    }
    if (name === 'fechaFirma') {
      const hoy = formatDateLocal(new Date());
      if (value && value > hoy) {
        setFechaFirma(value);
        setCotizaciones(null);
        setCotizacionesError('La fecha del acto no puede ser posterior a hoy.');
        setResultado(null);
        setErrorMsg(null);
        return;
      }
      setFechaFirma(value);
      setCotizacionesError(null);
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
      setErrorMsg('Elegí el acto y, si corresponde, el tipo de bien.');
      return;
    }
    const hoy = formatDateLocal(new Date());
    if (fechaFirma > hoy) {
      setErrorMsg('La fecha del acto no puede ser posterior a hoy.');
      return;
    }
    if (!cotizaciones) {
      setErrorMsg('Esperá a que carguen las cotizaciones o revisá la fecha del documento.');
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
    const esFideicomiso =
      actoParsed?.capituloId === 'actos-contratos' &&
      (actoParsed.posDoc === 10 || actoParsed.posDoc === 11);
    const out = calcularHonorario(regla, valores, ctx, { esFideicomiso });
    if ('error' in out) {
      setErrorMsg(out.error);
      return;
    }
    setResultado(out);
  };

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
            <h2>Paso 1: Acto</h2>
            <ActoSearchCombobox
              label="Acto"
              name="acto"
              options={opcionesActo}
              value={actoKey}
              onChange={handleActoKey}
              placeholder="Buscá por palabras (ej. firmas, certificación…)"
              required
            />
            <p className="form-hint" style={{ marginTop: '0.65rem' }}>
              Listado único de los tres capítulos del arancel, ordenado alfabéticamente. Podés escribir varias palabras;
              se muestran los actos que contienen todas ellas.
            </p>
          </div>

          {muestraPasoBien && (
            <>
              <hr className="form-divider" />
              <div className="form-section">
                <h2>Paso 2: Tipo de bien</h2>
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
                <h2>Fecha del acto y moneda</h2>
                <p className="form-hint" style={{ marginBottom: '0.75rem' }}>
                  La fecha debe ser <strong>hoy o anterior</strong>: el simulador usa cotizaciones ya publicadas (no proyecta actos
                  futuros).
                </p>
                <div className="form-grid form-grid--align-end">
                  <Input
                    label="Fecha del acto / firma"
                    name="fechaFirma"
                    type="date"
                    value={fechaFirma}
                    onChange={handleChange}
                    max={formatDateLocal(new Date())}
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
                  <p className="form-hint">Consultando cotizaciones (dólar, UI, UR)…</p>
                )}
                {cotizacionesError && (
                  <div className="form-note" style={{ borderColor: '#fecaca', background: '#fef2f2' }}>
                    <p style={{ color: '#991b1b' }}>{cotizacionesError}</p>
                  </div>
                )}
                {cotizaciones && !cotizacionesCargando && (
                  <div className="form-note" style={{ marginTop: '1rem' }}>
                    <p className="form-hint" style={{ marginBottom: '0.5rem' }}>
                      <strong>Cotizaciones usadas</strong> (dólar: INE Cotización monedas; UI y UR: BCU)
                    </p>
                    <ul className="form-hint" style={{ paddingLeft: '1.25rem', lineHeight: 1.6 }}>
                      <li>
                        <strong>Día hábil anterior al acto</strong> (criterio dólar):{' '}
                        {cotizaciones.fechaDiaHabilAnteriorActo}. Dólar USA <strong>compra</strong>:{' '}
                        {cotizaciones.dolarComprador.toLocaleString('es-UY')} $ — dato del día{' '}
                        {cotizaciones.fechaDolarCompra}
                        {cotizaciones.fuenteDolar === 'ine'
                          ? ' (serie Cotización monedas del INE; si no hay fila exacta, el día previo con dato).'
                          : ' (pizarra BROU, último respaldo cuando el día hábil anterior es hoy y el INE no respondió).'}
                        {cotizaciones.dolarNota ? (
                          <span style={{ display: 'block', marginTop: '0.25rem', fontStyle: 'italic' }}>
                            {cotizaciones.dolarNota}
                          </span>
                        ) : null}
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
                  {resultado.aplicoMinimoArt18 && (
                    <p className="form-hint" style={{ marginTop: '0.4rem' }}>
                      Se aplicó el honorario mínimo del artículo 18 del Arancel ({resultado.minimoArt18Ur} UR según valor
                      semestral de la UR).
                    </p>
                  )}
                  {resultado.monedaPrincipal !== 'UYU' && (
                    <p style={{ marginTop: '0.5rem' }}>
                      Equivalente en pesos uruguayos: <strong>$ {resultado.montoPesosFormateado}</strong>
                    </p>
                  )}
                </>
              )}
              <p className="form-hint" style={{ marginTop: '0.65rem', fontSize: '0.82rem', lineHeight: 1.4 }}>
                No se incluye en el cálculo los casos de tratamiento diferencial previstos en artículo 20 del Arancel.
              </p>
            </div>
          )}

          {resultado && tasasCalculo && (
            <div className="simulador-desglose-wrap">
              <h3>Facturación, aportes y líquido estimado</h3>
              <div className="simulador-desglose-grid simulador-desglose-grid--aligned">
                <div className="form-note simulador-desglose-column">
                  <div className="simulador-desglose-sync-row">
                    <h4>Honorario según arancel</h4>
                  </div>
                  <div className="simulador-desglose-sync-row" aria-hidden />
                  <div className="simulador-desglose-sync-row simulador-desglose-sync-row--factura-y-aportes">
                    <div className="simulador-desglose-stack">
                      <div className="simulador-desglose-seccion">
                        {lineasArancelColumna ? (
                          bloqueFacturaDesglose(lineasArancelColumna, resultado.monedaPrincipal)
                        ) : (
                          <p className="form-hint" style={{ color: '#991b1b' }}>
                            Elegí porcentajes válidos de Fonasa e IRPF para ver el desglose.
                          </p>
                        )}
                      </div>
                      <div className="simulador-desglose-seccion">
                        {lineasArancelColumna ? (
                          bloqueAportesDesglose(lineasArancelColumna, resultado.monedaPrincipal)
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <div className="simulador-desglose-sync-row simulador-desglose-sync-row--desde-gastos">
                    <div className="simulador-desglose-stack">
                      <div className="simulador-desglose-seccion">
                        <p className="simulador-desglose-sub">Gastos</p>
                        {lineasArancelColumna ? (
                          <div className="simulador-desglose-bloque-interno">
                            {bloqueValoresGastosDesglose(
                              lineasArancelColumna,
                              resultado.monedaPrincipal
                            )}
                          </div>
                        ) : null}
                        <Select
                          label="IRPF — alícuota estimada"
                          name="simIrpfArancel"
                          value={irpfPctStr}
                          onChange={(e) => setIrpfPctStr(e.target.value)}
                          options={OPCIONES_IRPF_SIM}
                          placeholder="Elegí el porcentaje"
                          className="simulador-desglose-select-field"
                        />
                        <Select
                          label="Fonasa (sobre el 70 % del honorario)"
                          name="simFonasaArancel"
                          value={fonasaPctStr}
                          onChange={(e) => setFonasaPctStr(e.target.value)}
                          options={OPCIONES_FONASA_SIM}
                          placeholder="Elegí el porcentaje"
                          className="simulador-desglose-select-field"
                        />
                        <p className="simulador-desglose-irpf-leyenda">{TEXTO_LEYENDA_IRPF}</p>
                        {lineasArancelColumna ? (
                          <div className="simulador-desglose-bloque-interno">
                            {bloqueTotalGastosDesglose(
                              lineasArancelColumna,
                              resultado.monedaPrincipal
                            )}
                          </div>
                        ) : null}
                      </div>
                      <div className="simulador-desglose-seccion simulador-desglose-seccion--liquido">
                        {lineasArancelColumna
                          ? bloqueLiquidoDesglose(lineasArancelColumna, resultado.monedaPrincipal)
                          : null}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="form-note simulador-desglose-column">
                  <div className="simulador-desglose-sync-row">
                    <h4>Honorario a cobrar</h4>
                  </div>
                  <div className="simulador-desglose-sync-row">
                    <Input
                      label={`Honorarios a cobrar (${etiquetaCampoPrincipal(resultado.monedaPrincipal)})`}
                      name="honorarioAlternativoSim"
                      type="text"
                      value={honorarioAlternativoStr}
                      onChange={(e) => setHonorarioAlternativoStr(e.target.value)}
                      placeholder="0"
                    />
                    {honorarioAltValor === null && honorarioAlternativoStr.trim() !== '' ? (
                      <p className="form-hint" style={{ color: '#991b1b' }}>
                        Ingresá un importe válido (coma decimal; punto para miles, ej. 3.000).
                      </p>
                    ) : null}
                    {honorarioAltValor === null && honorarioAlternativoStr.trim() === '' ? (
                      <p className="form-hint" style={{ color: '#991b1b' }}>
                        Ingresá el honorario a cobrar para ver el desglose.
                      </p>
                    ) : null}
                  </div>
                  <div className="simulador-desglose-sync-row simulador-desglose-sync-row--factura-y-aportes">
                    <div className="simulador-desglose-stack">
                      <div className="simulador-desglose-seccion">
                        {lineasAltColumna ? (
                          bloqueFacturaDesglose(
                            lineasAltColumna,
                            resultado.monedaPrincipal,
                            'Honorarios a cobrar'
                          )
                        ) : honorarioAltValor !== null && !pctOk ? (
                          <p className="form-hint" style={{ color: '#991b1b' }}>
                            Elegí porcentajes válidos de Fonasa e IRPF para ver el desglose.
                          </p>
                        ) : null}
                      </div>
                      <div className="simulador-desglose-seccion">
                        {lineasAltColumna && lineasArancelColumna ? (
                          bloqueAportesDesglose(lineasArancelColumna, resultado.monedaPrincipal)
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <div className="simulador-desglose-sync-row simulador-desglose-sync-row--desde-gastos">
                    <div className="simulador-desglose-stack">
                      <div className="simulador-desglose-seccion">
                        <p className="simulador-desglose-sub">Gastos</p>
                        {lineasAltColumna ? (
                          <div className="simulador-desglose-bloque-interno">
                            {bloqueValoresGastosDesglose(
                              lineasAltColumna,
                              resultado.monedaPrincipal
                            )}
                          </div>
                        ) : null}
                        <Select
                          label="IRPF — alícuota estimada"
                          name="simIrpfAlt"
                          value={irpfPctStr}
                          onChange={(e) => setIrpfPctStr(e.target.value)}
                          options={OPCIONES_IRPF_SIM}
                          placeholder="Elegí el porcentaje"
                          className="simulador-desglose-select-field"
                        />
                        <Select
                          label="Fonasa (sobre el 70 % del honorario)"
                          name="simFonasaAlt"
                          value={fonasaPctStr}
                          onChange={(e) => setFonasaPctStr(e.target.value)}
                          options={OPCIONES_FONASA_SIM}
                          placeholder="Elegí el porcentaje"
                          className="simulador-desglose-select-field"
                        />
                        <p className="simulador-desglose-irpf-leyenda">{TEXTO_LEYENDA_IRPF}</p>
                        {lineasAltColumna ? (
                          <div className="simulador-desglose-bloque-interno">
                            {bloqueTotalGastosDesglose(
                              lineasAltColumna,
                              resultado.monedaPrincipal
                            )}
                          </div>
                        ) : null}
                      </div>
                      <div className="simulador-desglose-seccion simulador-desglose-seccion--liquido">
                        {lineasAltColumna
                          ? bloqueLiquidoDesglose(lineasAltColumna, resultado.monedaPrincipal)
                          : null}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {seleccionCompleta && !resultado && (
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
