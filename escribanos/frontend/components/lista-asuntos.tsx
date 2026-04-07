"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

function ToggleSwitch({
  checked,
  onChange,
  id,
  ariaLabel,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  id: string;
  ariaLabel: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border border-black/[0.06] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--verde-principal)] ${
        checked ? "bg-[var(--verde-principal)]" : "bg-neutral-200/90"
      }`}
    >
      <span
        className={`pointer-events-none absolute top-1 left-1 size-6 rounded-full bg-white shadow-md ring-1 ring-black/[0.06] transition-transform duration-200 ease-out ${
          checked ? "translate-x-6" : "translate-x-0"
        }`}
      />
    </button>
  );
}

type AsuntoRow = {
  id: string;
  ordinal: number;
  tipo: string;
  estado: string;
  fechaInicio: string;
  fechaAlertaVencimiento: string | null;
  fechaFinalizacion: string | null;
  descripcion: string | null;
  ultimoMovimientoTexto: string | null;
  cliente: { id: string; nombre: string; documento: string };
  catalogo: { nombre: string };
  socioReferente: { nombre: string } | null;
  profesionalACargo: { nombre: string } | null;
  colaboradorACargo: { nombre: string } | null;
  colaboradorACargo2: { nombre: string } | null;
  contadorReferente: { nombre: string } | null;
};

type ProfesionalFiltro = {
  id: string;
  nombre: string;
};

type SocioFiltro = {
  id: string;
  nombre: string;
};

type RolMe =
  | "ADMIN"
  | "USUARIO"
  | "SOCIO"
  | "PROFESIONAL"
  | "COLABORADOR"
  | "CONTADOR"
  | "SOLO_LECTURA";

/** Contenedor general del área de filtros (sin esquinas redondeadas) */
const panelFiltros =
  "border border-neutral-200/90 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] sm:p-6 lg:p-7";

/** Separación entre grupos de filtros: solo líneas, sin marcos redondeados */
const seccionFiltro = "py-6 first:pt-0";

/** Campos dentro de un bloque */
const inputFiltro =
  "input-app border-neutral-200/80 bg-white text-neutral-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)] placeholder:text-neutral-400 focus:border-[rgba(0,166,81,0.45)]";

function TituloBloqueFiltro({ children, ayuda }: { children: ReactNode; ayuda?: ReactNode }) {
  return (
    <div
      className="group relative border-b border-neutral-200 pb-3 outline-none focus-visible:ring-2 focus-visible:ring-[var(--verde-principal)]/25 focus-visible:ring-offset-2"
      tabIndex={ayuda ? 0 : undefined}
    >
      <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-600">{children}</h3>
      {ayuda ? (
        <div
          className="absolute left-0 right-0 top-full z-20 pt-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
          role="tooltip"
        >
          <div className="max-w-[min(100%,28rem)] border border-neutral-200/90 bg-white px-3 py-2 text-left text-xs font-normal normal-case leading-snug tracking-normal text-neutral-600 shadow-md">
            {ayuda}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function EtiquetaCampo({ children }: { children: ReactNode }) {
  return (
    <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-neutral-500">{children}</span>
  );
}

function etiquetaTipo(tipo: string): string {
  switch (tipo) {
    case "TODOS":
      return "Todos";
    case "NOTARIAL":
      return "Notarial";
    case "LEGAL":
      return "Legal";
    default:
      return tipo;
  }
}

function fmtFechaCorta(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("es-UY", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function textoColaboradores(a: AsuntoRow): string {
  const parts = [a.colaboradorACargo?.nombre, a.colaboradorACargo2?.nombre].filter(Boolean) as string[];
  return parts.length ? parts.join(" · ") : "—";
}

export function ListaAsuntos() {
  const [estado, setEstado] = useState<string>("");
  const [tipo, setTipo] = useState<string>("");
  const [profesionalACargoId, setProfesionalACargoId] = useState<string>("");
  const [socioReferenteId, setSocioReferenteId] = useState<string>("");
  const [anioInicio, setAnioInicio] = useState<string>("");
  const [fechaInicioDesde, setFechaInicioDesde] = useState<string>("");
  const [fechaInicioHasta, setFechaInicioHasta] = useState<string>("");
  const [fechaFinalizacionDesde, setFechaFinalizacionDesde] = useState<string>("");
  const [fechaFinalizacionHasta, setFechaFinalizacionHasta] = useState<string>("");
  const [profesionales, setProfesionales] = useState<ProfesionalFiltro[]>([]);
  const [socios, setSocios] = useState<SocioFiltro[]>([]);
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [sinEquipo, setSinEquipo] = useState(false);
  const [sinContador, setSinContador] = useState(false);
  const [lista, setLista] = useState<AsuntoRow[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [rol, setRol] = useState<RolMe | null>(null);

  const hayFiltrosActivos = useMemo(
    () =>
      Boolean(
        estado ||
          tipo ||
          profesionalACargoId ||
          socioReferenteId ||
          anioInicio ||
          fechaInicioDesde ||
          fechaInicioHasta ||
          fechaFinalizacionDesde ||
          fechaFinalizacionHasta ||
          debounced ||
          sinEquipo ||
          sinContador,
      ),
    [
      estado,
      tipo,
      profesionalACargoId,
      socioReferenteId,
      anioInicio,
      fechaInicioDesde,
      fechaInicioHasta,
      fechaFinalizacionDesde,
      fechaFinalizacionHasta,
      debounced,
      sinEquipo,
      sinContador,
    ],
  );

  const filtrosActivosCount = useMemo(() => {
    let n = 0;
    if (estado) n += 1;
    if (tipo) n += 1;
    if (profesionalACargoId) n += 1;
    if (socioReferenteId) n += 1;
    if (anioInicio) n += 1;
    if (fechaInicioDesde) n += 1;
    if (fechaInicioHasta) n += 1;
    if (fechaFinalizacionDesde) n += 1;
    if (fechaFinalizacionHasta) n += 1;
    if (debounced) n += 1;
    if (sinEquipo) n += 1;
    if (sinContador) n += 1;
    return n;
  }, [
    estado,
    tipo,
    profesionalACargoId,
    socioReferenteId,
    anioInicio,
    fechaInicioDesde,
    fechaInicioHasta,
    fechaFinalizacionDesde,
    fechaFinalizacionHasta,
    debounced,
    sinEquipo,
    sinContador,
  ]);

  function limpiarFiltros() {
    setEstado("");
    setTipo("");
    setProfesionalACargoId("");
    setSocioReferenteId("");
    setAnioInicio("");
    setFechaInicioDesde("");
    setFechaInicioHasta("");
    setFechaFinalizacionDesde("");
    setFechaFinalizacionHasta("");
    setSinEquipo(false);
    setSinContador(false);
    setQ("");
  }

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 350);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    void fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setRol(d.rol as RolMe))
      .catch(() => setRol(null));
  }, []);

  useEffect(() => {
    void fetch("/api/catalogos")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const p = (d?.profesionales ?? []) as { id?: string; nombre?: string; grupo?: string }[];
        const s = (d?.socios ?? []) as { id?: string; nombre?: string }[];
        setProfesionales(
          p
            .filter(
              (x) =>
                typeof x.id === "string" &&
                typeof x.nombre === "string" &&
                x.grupo === "LEGAL_A_CARGO",
            )
            .map((x) => ({ id: x.id as string, nombre: x.nombre as string })),
        );
        setSocios(
          s
            .filter((x) => typeof x.id === "string" && typeof x.nombre === "string")
            .map((x) => ({ id: x.id as string, nombre: x.nombre as string })),
        );
      })
      .catch(() => {
        setProfesionales([]);
        setSocios([]);
      });
  }, []);

  const cargar = useCallback(async () => {
    setCargando(true);
    setMensaje("");
    try {
      const params = new URLSearchParams();
      if (estado) params.set("estado", estado);
      if (tipo) params.set("tipo", tipo);
      if (profesionalACargoId) params.set("profesionalACargoId", profesionalACargoId);
      if (socioReferenteId) params.set("socioReferenteId", socioReferenteId);
      if (anioInicio) params.set("anioInicio", anioInicio);
      if (fechaInicioDesde) params.set("fechaInicioDesde", fechaInicioDesde);
      if (fechaInicioHasta) params.set("fechaInicioHasta", fechaInicioHasta);
      if (fechaFinalizacionDesde) params.set("fechaFinalizacionDesde", fechaFinalizacionDesde);
      if (fechaFinalizacionHasta) params.set("fechaFinalizacionHasta", fechaFinalizacionHasta);
      if (debounced) params.set("q", debounced);
      if (sinEquipo) params.set("sinEquipo", "1");
      if (sinContador) params.set("sinContador", "1");
      const qs = params.toString();
      const response = await fetch(qs ? `/api/asuntos?${qs}` : "/api/asuntos");
      const data = await response.json();
      if (!response.ok) {
        setMensaje(data?.error ?? "No se pudo cargar asuntos.");
        return;
      }
      setLista(data as AsuntoRow[]);
    } catch {
      setMensaje("Error de conexion.");
    } finally {
      setCargando(false);
    }
  }, [
    debounced,
    estado,
    tipo,
    profesionalACargoId,
    socioReferenteId,
    anioInicio,
    fechaInicioDesde,
    fechaInicioHasta,
    fechaFinalizacionDesde,
    fechaFinalizacionHasta,
    sinEquipo,
    sinContador,
  ]);

  useEffect(() => {
    void cargar().catch(() => setCargando(false));
  }, [cargar]);

  return (
    <div className="min-w-0 space-y-9">
      <div className="flex flex-col gap-4 border-b border-neutral-200/70 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[0.9375rem] text-neutral-700">
          <span className="font-medium text-neutral-500">Rol:</span>{" "}
          <span className="font-semibold text-neutral-900">{rol ?? "…"}</span>
          {!cargando ? (
            <>
              <span className="mx-2 text-neutral-300">|</span>
              <span className="tabular-nums text-[var(--verde-titulo)]">
                {lista.length} {lista.length === 1 ? "resultado" : "resultados"}
              </span>
            </>
          ) : null}
        </p>
        {hayFiltrosActivos ? (
          <button
            type="button"
            className="inline-flex min-h-[2.625rem] items-center justify-center self-start rounded-xl border border-neutral-200/90 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 shadow-sm transition-colors hover:border-[rgba(0,166,81,0.3)] hover:bg-[var(--fondo-verde-muy-claro)] sm:self-auto"
            onClick={limpiarFiltros}
          >
            Limpiar filtros
          </button>
        ) : null}
      </div>

      <div className={panelFiltros}>
        {filtrosActivosCount > 0 ? (
          <div className="mb-6 border border-[rgba(0,166,81,0.25)] bg-[rgba(0,166,81,0.07)] px-4 py-3 text-sm font-semibold text-[var(--verde-oscuro)]">
            <span>Filtros aplicados</span>
            <span className="ml-2 font-normal text-neutral-600">
              · {filtrosActivosCount} criterio{filtrosActivosCount === 1 ? "" : "s"}
            </span>
          </div>
        ) : null}

        <div className="divide-y divide-neutral-200/80">
          <div className={seccionFiltro}>
            <TituloBloqueFiltro
              ayuda="Buscá por cliente, documento o nombre del asunto. Podés combinar con estado (en trámite / finalizado) y tipo (notarial, legal o catálogo)."
            >
              Búsqueda y criterios
            </TituloBloqueFiltro>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
              <label className="lg:col-span-2">
                <EtiquetaCampo>Buscar</EtiquetaCampo>
                <input
                  className={inputFiltro}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Cliente, documento, asunto…"
                  autoComplete="off"
                />
              </label>
              <label>
                <EtiquetaCampo>Estado</EtiquetaCampo>
                <select className={inputFiltro} value={estado} onChange={(e) => setEstado(e.target.value)}>
                  <option value="">Todos</option>
                  <option value="EN_TRAMITE">En trámite</option>
                  <option value="FINALIZADO">Finalizado</option>
                </select>
              </label>
              <label>
                <EtiquetaCampo>Tipo</EtiquetaCampo>
                <select className={inputFiltro} value={tipo} onChange={(e) => setTipo(e.target.value)}>
                  <option value="">Todos</option>
                  <option value="TODOS">Todos (catálogo)</option>
                  <option value="NOTARIAL">Notarial</option>
                  <option value="LEGAL">Legal</option>
                </select>
              </label>
            </div>
          </div>

          <div className={seccionFiltro}>
            <TituloBloqueFiltro
              ayuda="Legal a cargo: profesional del estudio asignado al expediente. Socio referente: socio vinculado al asunto (puede quedar sin asignar)."
            >
              Equipo
            </TituloBloqueFiltro>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:gap-6">
              <label className="min-w-0">
                <EtiquetaCampo>Legal a cargo</EtiquetaCampo>
                <select
                  className={inputFiltro}
                  value={profesionalACargoId}
                  onChange={(e) => setProfesionalACargoId(e.target.value)}
                >
                  <option value="">Todos</option>
                  {profesionales.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </label>
              <label className="min-w-0">
                <EtiquetaCampo>Socio referente</EtiquetaCampo>
                <select
                  className={inputFiltro}
                  value={socioReferenteId}
                  onChange={(e) => setSocioReferenteId(e.target.value)}
                >
                  <option value="">Todos</option>
                  {socios.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className={seccionFiltro}>
            <TituloBloqueFiltro
              ayuda="Opcional: listá solo expedientes sin colaboradores (ni en colab. 1 ni en 2) o sin contador referente. Usá «Filtrar» para refrescar la lista."
            >
              Pendientes
            </TituloBloqueFiltro>
            <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6">
                <div className="flex items-center gap-3 border border-neutral-200/90 bg-neutral-50/80 px-4 py-3">
                  <ToggleSwitch
                    id="filtro-sin-equipo"
                    ariaLabel="Filtrar asuntos sin colaboradores"
                    checked={sinEquipo}
                    onChange={setSinEquipo}
                  />
                  <span className="text-sm font-semibold text-neutral-800">Sin colaboradores</span>
                </div>
                <div className="flex items-center gap-3 border border-neutral-200/90 bg-neutral-50/80 px-4 py-3">
                  <ToggleSwitch
                    id="filtro-sin-contador"
                    ariaLabel="Filtrar asuntos sin contador"
                    checked={sinContador}
                    onChange={setSinContador}
                  />
                  <span className="text-sm font-semibold text-neutral-800">Sin contador</span>
                </div>
              </div>
              <button
                type="button"
                className="btn-primary inline-flex min-h-[2.75rem] shrink-0 items-center justify-center rounded-xl px-8 py-2.5 text-sm font-semibold shadow-md shadow-[rgba(0,166,81,0.2)] lg:min-w-[10.5rem]"
                onClick={() => void cargar()}
              >
                Filtrar
              </button>
            </div>
          </div>

          <div className={seccionFiltro}>
            <TituloBloqueFiltro
              ayuda="Filtrá por año de inicio o por rango de fechas de inicio y de finalización del expediente."
            >
              Fechas
            </TituloBloqueFiltro>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              <label>
                <EtiquetaCampo>Año inicio</EtiquetaCampo>
                <input
                  className={inputFiltro}
                  value={anioInicio}
                  onChange={(e) => setAnioInicio(e.target.value)}
                  placeholder="Ej. 2026"
                  inputMode="numeric"
                />
              </label>
              <label>
                <EtiquetaCampo>Inicio desde</EtiquetaCampo>
                <input
                  className={inputFiltro}
                  type="date"
                  value={fechaInicioDesde}
                  onChange={(e) => setFechaInicioDesde(e.target.value)}
                />
              </label>
              <label>
                <EtiquetaCampo>Inicio hasta</EtiquetaCampo>
                <input
                  className={inputFiltro}
                  type="date"
                  value={fechaInicioHasta}
                  onChange={(e) => setFechaInicioHasta(e.target.value)}
                />
              </label>
            </div>
            <div className="mt-6 grid gap-5 border-t border-neutral-200/80 pt-6 sm:grid-cols-2 lg:gap-6">
              <label>
                <EtiquetaCampo>Finalización desde</EtiquetaCampo>
                <input
                  className={inputFiltro}
                  type="date"
                  value={fechaFinalizacionDesde}
                  onChange={(e) => setFechaFinalizacionDesde(e.target.value)}
                />
              </label>
              <label>
                <EtiquetaCampo>Finalización hasta</EtiquetaCampo>
                <input
                  className={inputFiltro}
                  type="date"
                  value={fechaFinalizacionHasta}
                  onChange={(e) => setFechaFinalizacionHasta(e.target.value)}
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {mensaje ? (
        <p className="rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-950 ring-1 ring-amber-200/50">{mensaje}</p>
      ) : null}

      {cargando ? (
        <p className="flex items-center gap-3 text-sm text-neutral-500">
          <span
            className="inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-neutral-200 border-t-[var(--verde-principal)]"
            aria-hidden
          />
          Cargando…
        </p>
      ) : lista.length === 0 ? (
        <div className="border border-dashed border-neutral-200 bg-neutral-50/50 px-6 py-12 text-center">
          <p className="text-sm font-medium text-[var(--verde-titulo)]">Sin resultados</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-600">
            {hayFiltrosActivos ? "Probá otros filtros o limpiá la búsqueda." : "Creá un asunto desde el botón superior."}
          </p>
          {hayFiltrosActivos ? (
            <button
              type="button"
              className="mt-4 text-sm font-medium text-[var(--verde-principal)] underline underline-offset-4"
              onClick={limpiarFiltros}
            >
              Limpiar filtros
            </button>
          ) : null}
        </div>
      ) : (
        <>
          <div className="hidden min-w-0 overflow-hidden border border-neutral-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] md:block">
            <div className="overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
              <table className="w-full min-w-[920px] text-left text-[0.8125rem] leading-snug text-neutral-800">
                <thead>
                  <tr className="border-b border-neutral-200 bg-[#f4f5f7]">
                    <th className="sticky left-0 z-20 bg-[#f4f5f7] px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-neutral-500 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.06)]">
                      #
                    </th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-neutral-500">Estado</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-neutral-500">Tipo</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-neutral-500">Cliente</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-neutral-500">Asunto</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-neutral-500">Socio</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-neutral-500">Prof.</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-neutral-500">Colab.</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-neutral-500">Cont.</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-neutral-500">Inicio</th>
                    <th className="sticky right-0 z-30 min-w-[8.5rem] border-l border-neutral-200/90 bg-[#f4f5f7] px-3 py-2.5 text-right text-[10px] font-bold uppercase tracking-wider text-neutral-500 shadow-[-6px_0_12px_-4px_rgba(0,0,0,0.06)]">
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {lista.map((a) => (
                    <tr
                      key={a.id}
                      className="group transition-colors hover:bg-[rgba(0,166,81,0.04)]"
                    >
                      <td className="sticky left-0 z-10 bg-white px-3 py-2.5 font-mono text-xs tabular-nums text-neutral-500 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)] group-hover:bg-[rgba(0,166,81,0.04)]">
                        {a.ordinal}
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={
                            a.estado === "FINALIZADO"
                              ? "text-xs text-neutral-500"
                              : "text-xs font-medium text-[var(--verde-principal)]"
                          }
                        >
                          {a.estado === "EN_TRAMITE" ? "En trámite" : "Finalizado"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-neutral-600">{etiquetaTipo(a.tipo)}</td>
                      <td className="max-w-[200px] px-3 py-2.5">
                        <span className="font-semibold text-neutral-900">{a.cliente.nombre}</span>
                        <span className="mt-0.5 block truncate text-[0.75rem] text-neutral-500">{a.cliente.documento}</span>
                      </td>
                      <td className="max-w-[200px] truncate px-3 py-2.5 text-neutral-900" title={a.catalogo.nombre}>
                        {a.catalogo.nombre}
                      </td>
                      <td
                        className="max-w-[120px] truncate px-3 py-2.5 text-neutral-600"
                        title={a.socioReferente?.nombre}
                      >
                        {a.socioReferente?.nombre ?? "—"}
                      </td>
                      <td
                        className="max-w-[120px] truncate px-3 py-2.5 text-neutral-600"
                        title={a.profesionalACargo?.nombre}
                      >
                        {a.profesionalACargo?.nombre ?? "—"}
                      </td>
                      <td
                        className="max-w-[140px] truncate px-3 py-2.5 text-neutral-600"
                        title={textoColaboradores(a) === "—" ? undefined : textoColaboradores(a)}
                      >
                        {textoColaboradores(a)}
                      </td>
                      <td className="max-w-[100px] truncate px-3 py-2.5 text-neutral-600" title={a.contadorReferente?.nombre}>
                        {a.contadorReferente?.nombre ?? "—"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 tabular-nums text-neutral-600">{fmtFechaCorta(a.fechaInicio)}</td>
                      <td className="sticky right-0 z-10 min-w-[8.5rem] border-l border-neutral-100 bg-white px-2.5 py-2 text-right shadow-[-8px_0_14px_-6px_rgba(0,0,0,0.07)] group-hover:bg-[rgba(0,166,81,0.04)]">
                        <Link
                          className="inline-flex min-h-[2.125rem] min-w-[6.25rem] items-center justify-center bg-[var(--verde-principal)] px-3 py-1.5 text-xs font-semibold text-white shadow-sm ring-1 ring-black/[0.04] transition-colors hover:bg-[var(--verde-oscuro)]"
                          href={`/estudio/asuntos/${a.id}`}
                        >
                          Ver ficha
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <ul className="space-y-4 md:hidden">
            {lista.map((a) => (
              <li
                key={a.id}
                className="border border-black/[0.06] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
              >
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-neutral-400">#{a.ordinal}</p>
                    <p className="mt-0.5 font-medium leading-snug text-neutral-900">{a.catalogo.nombre}</p>
                    <p className="mt-1 text-sm text-neutral-600">{a.cliente.nombre}</p>
                    <p className="text-xs text-neutral-500">{a.cliente.documento}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span
                      className={
                        a.estado === "FINALIZADO"
                          ? "text-xs text-neutral-500"
                          : "text-xs font-medium text-[var(--verde-principal)]"
                      }
                    >
                      {a.estado === "EN_TRAMITE" ? "En trámite" : "Finalizado"}
                    </span>
                    <Link
                      className="inline-flex min-h-[2.5rem] min-w-[6.5rem] items-center justify-center bg-[var(--verde-principal)] px-3 py-2 text-center text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--verde-oscuro)]"
                      href={`/estudio/asuntos/${a.id}`}
                    >
                      Ver ficha
                    </Link>
                  </div>
                </div>
                <dl className="mt-4 grid gap-1 border-t border-neutral-100 pt-4 text-sm text-neutral-600">
                  <div className="flex justify-between gap-2">
                    <dt className="text-neutral-400">Tipo</dt>
                    <dd>{etiquetaTipo(a.tipo)}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-neutral-400">Socio</dt>
                    <dd className="min-w-0 truncate text-right">{a.socioReferente?.nombre ?? "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-neutral-400">Prof.</dt>
                    <dd className="min-w-0 truncate text-right">{a.profesionalACargo?.nombre ?? "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-neutral-400">Colab.</dt>
                    <dd className="min-w-0 truncate text-right">{textoColaboradores(a)}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-neutral-400">Cont.</dt>
                    <dd className="min-w-0 truncate text-right">{a.contadorReferente?.nombre ?? "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-neutral-400">Inicio</dt>
                    <dd className="tabular-nums">{fmtFechaCorta(a.fechaInicio)}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
