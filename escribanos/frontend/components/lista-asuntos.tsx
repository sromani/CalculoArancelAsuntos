"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { estudioTw } from "@/lib/estudio-tw";
import { cn } from "@/lib/cn";

const surface = estudioTw.surface;
const cardPadX = estudioTw.cardPadX;
const inputBase = estudioTw.inputSm;
const btnPrimary = estudioTw.btnPrimarySm;
const btnSecondary = estudioTw.btnSecondarySm;
const btnGhost = estudioTw.btnGhost;

/** Enlace de acción: texto verde y subrayado (más marcado al hover / foco). */
const linkVerFicha =
  "text-xs font-semibold text-emerald-700 underline decoration-emerald-600/35 underline-offset-2 transition hover:text-emerald-800 hover:decoration-emerald-700 focus-visible:rounded-sm focus-visible:text-emerald-800 focus-visible:decoration-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 sm:text-sm";

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
      className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
        checked ? "bg-emerald-600" : "bg-gray-200"
      }`}
    >
      <span
        className={`pointer-events-none absolute top-0.5 left-0.5 size-6 rounded-full bg-white shadow-md ring-1 ring-slate-900/5 transition-transform duration-200 ease-out ${
          checked ? "translate-x-5" : "translate-x-0"
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

function EtiquetaCampo({ children, size = "sm" }: { children: ReactNode; size?: "sm" | "lg" }) {
  const sizeClass =
    size === "lg"
      ? "text-base font-semibold tracking-tight text-gray-900 sm:text-[1.0625rem]"
      : "text-sm font-semibold text-gray-700";
  return <span className={`mb-2.5 block ${sizeClass}`}>{children}</span>;
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

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function FiltroAccordion({
  sectionId,
  title,
  helpText,
  open,
  onToggle,
  children,
}: {
  sectionId: string;
  title: string;
  helpText?: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 rounded-lg py-3.5 text-left transition-colors hover:bg-gray-50/90 sm:py-4"
        aria-expanded={open}
        aria-controls={`${sectionId}-panel`}
        id={`${sectionId}-btn`}
        onClick={onToggle}
      >
        <span className="text-sm font-semibold text-gray-900">{title}</span>
        <ChevronDown
          className={cn("size-5 shrink-0 text-gray-500 transition-transform duration-200", open ? "rotate-180" : "")}
        />
      </button>
      <div
        id={`${sectionId}-panel`}
        role="region"
        aria-labelledby={`${sectionId}-btn`}
        hidden={!open}
        className={cn(!open && "hidden")}
      >
        {helpText ? (
          <p className="mb-4 max-w-3xl text-xs leading-relaxed text-gray-600">{helpText}</p>
        ) : null}
        {children}
      </div>
    </div>
  );
}

type FiltroAccKey = "criterios" | "equipo" | "pendientes" | "fechas";

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
  const [busquedaAvanzada, setBusquedaAvanzada] = useState(false);
  const [filtroAcc, setFiltroAcc] = useState<Record<FiltroAccKey, boolean>>({
    criterios: true,
    equipo: false,
    pendientes: false,
    fechas: false,
  });

  const toggleFiltroAcc = useCallback((k: FiltroAccKey) => {
    setFiltroAcc((prev) => ({ ...prev, [k]: !prev[k] }));
  }, []);

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
    <div className="flex w-full min-w-0 flex-col gap-6 text-left">
      <div className={surface}>
        <div
          className={cn(
            "sticky z-30 border-b border-gray-100/90 bg-gradient-to-b from-white/98 to-gray-50/25 py-3 shadow-sm backdrop-blur-md sm:py-4",
            cardPadX,
          )}
          style={{
            top: "calc(var(--navbar-app-height) + var(--estudio-barra-height))",
          }}
        >
          <div className="min-w-0">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <div className={estudioTw.busquedaCompactOuter}>
                <div className={estudioTw.busquedaCompactShell}>
                  <span className={estudioTw.busquedaCompactIconWrap} aria-hidden>
                    <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.2-5.2M10 18a8 8 0 110-16 8 8 0 010 16z" />
                    </svg>
                  </span>
                  <input
                    type="search"
                    aria-label="Buscar asuntos"
                    className={estudioTw.busquedaCompactInput}
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Nombre, nº carpeta, escribano…"
                    autoComplete="off"
                  />
                </div>
              </div>
              <button
                type="button"
                className={busquedaAvanzada ? btnSecondary : btnGhost}
                aria-expanded={busquedaAvanzada}
                onClick={() => setBusquedaAvanzada((v) => !v)}
              >
                <span className="hidden sm:inline">{busquedaAvanzada ? "Ocultar filtros" : "Más filtros"}</span>
                <span className="sm:hidden">{busquedaAvanzada ? "Ocultar" : "Filtros"}</span>
              </button>
            </div>

            {filtrosActivosCount > 0 ? (
              <div className="mt-2.5 rounded-lg border border-emerald-200/70 bg-emerald-50/60 px-2.5 py-2 text-[11px] text-gray-600 sm:text-xs">
                <span className="font-semibold text-gray-900">Filtros activos:</span>{" "}
                <span className="tabular-nums text-gray-700">{filtrosActivosCount}</span> criterio
                {filtrosActivosCount === 1 ? "" : "s"}
              </div>
            ) : null}

            {cargando || hayFiltrosActivos ? (
              <div className="mt-2.5 flex flex-wrap items-center justify-end gap-2 border-t border-gray-100/80 pt-2.5 sm:gap-3 sm:pt-3">
                {cargando ? (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-gray-500 sm:text-xs sm:tracking-normal">
                    <span
                      className="size-3 shrink-0 animate-spin rounded-full border border-gray-200 border-t-emerald-600"
                      aria-hidden
                    />
                    Actualizando
                  </span>
                ) : null}
                {hayFiltrosActivos ? (
                  <button type="button" className={btnGhost} onClick={limpiarFiltros}>
                    Limpiar filtros
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        {busquedaAvanzada ? (
          <div className="border-t border-gray-100 bg-gray-50/40">
            <div className={cardPadX}>
              <p className="py-3 text-xs font-medium text-gray-500">
                Desplegá cada bloque para afinar el listado. Los valores se mantienen al cerrar.
              </p>
              <FiltroAccordion
                sectionId="filtro-criterios"
                title="Criterios del asunto"
                helpText="Filtrá por situación del expediente y por tipo de actuación."
                open={filtroAcc.criterios}
                onToggle={() => toggleFiltroAcc("criterios")}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <label>
                    <EtiquetaCampo>Estado</EtiquetaCampo>
                    <select className={inputBase} value={estado} onChange={(e) => setEstado(e.target.value)}>
                      <option value="">Todos</option>
                      <option value="EN_TRAMITE">En trámite</option>
                      <option value="FINALIZADO">Finalizado</option>
                    </select>
                  </label>
                  <label>
                    <EtiquetaCampo>Tipo</EtiquetaCampo>
                    <select className={inputBase} value={tipo} onChange={(e) => setTipo(e.target.value)}>
                      <option value="">Todos</option>
                      <option value="TODOS">Todos (catálogo)</option>
                      <option value="NOTARIAL">Notarial</option>
                      <option value="LEGAL">Legal</option>
                    </select>
                  </label>
                </div>
              </FiltroAccordion>

              <FiltroAccordion
                sectionId="filtro-equipo"
                title="Equipo"
                helpText="Legal a cargo: profesional del estudio asignado al expediente. Socio referente: socio vinculado al asunto (puede quedar sin asignar)."
                open={filtroAcc.equipo}
                onToggle={() => toggleFiltroAcc("equipo")}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="min-w-0">
                    <EtiquetaCampo>Legal a cargo</EtiquetaCampo>
                    <select
                      className={inputBase}
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
                      className={inputBase}
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
              </FiltroAccordion>

              <FiltroAccordion
                sectionId="filtro-pendientes"
                title="Pendientes"
                helpText="Listá solo expedientes sin colaboradores (ni en colab. 1 ni en 2) o sin contador referente."
                open={filtroAcc.pendientes}
                onToggle={() => toggleFiltroAcc("pendientes")}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
                  <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white px-4 py-3.5 shadow-sm">
                    <ToggleSwitch
                      id="filtro-sin-equipo"
                      ariaLabel="Filtrar asuntos sin colaboradores"
                      checked={sinEquipo}
                      onChange={setSinEquipo}
                    />
                    <span className="text-sm font-medium text-gray-900">Sin colaboradores</span>
                  </div>
                  <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white px-4 py-3.5 shadow-sm">
                    <ToggleSwitch
                      id="filtro-sin-contador"
                      ariaLabel="Filtrar asuntos sin contador"
                      checked={sinContador}
                      onChange={setSinContador}
                    />
                    <span className="text-sm font-medium text-gray-900">Sin contador</span>
                  </div>
                </div>
              </FiltroAccordion>

              <FiltroAccordion
                sectionId="filtro-fechas"
                title="Fechas"
                helpText="Filtrá por año de inicio o por rango de fechas de inicio y de finalización del expediente."
                open={filtroAcc.fechas}
                onToggle={() => toggleFiltroAcc("fechas")}
              >
                <div className="space-y-8">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <label>
                      <EtiquetaCampo>Año inicio</EtiquetaCampo>
                      <input
                        className={inputBase}
                        value={anioInicio}
                        onChange={(e) => setAnioInicio(e.target.value)}
                        placeholder="Ej. 2026"
                        inputMode="numeric"
                      />
                    </label>
                    <label>
                      <EtiquetaCampo>Inicio desde</EtiquetaCampo>
                      <input
                        className={inputBase}
                        type="date"
                        value={fechaInicioDesde}
                        onChange={(e) => setFechaInicioDesde(e.target.value)}
                      />
                    </label>
                    <label>
                      <EtiquetaCampo>Inicio hasta</EtiquetaCampo>
                      <input
                        className={inputBase}
                        type="date"
                        value={fechaInicioHasta}
                        onChange={(e) => setFechaInicioHasta(e.target.value)}
                      />
                    </label>
                  </div>
                  <div className="grid gap-4 border-t border-gray-200 pt-6 sm:grid-cols-2">
                    <label>
                      <EtiquetaCampo>Finalización desde</EtiquetaCampo>
                      <input
                        className={inputBase}
                        type="date"
                        value={fechaFinalizacionDesde}
                        onChange={(e) => setFechaFinalizacionDesde(e.target.value)}
                      />
                    </label>
                    <label>
                      <EtiquetaCampo>Finalización hasta</EtiquetaCampo>
                      <input
                        className={inputBase}
                        type="date"
                        value={fechaFinalizacionHasta}
                        onChange={(e) => setFechaFinalizacionHasta(e.target.value)}
                      />
                    </label>
                  </div>
                </div>
              </FiltroAccordion>
            </div>

            <div
              className={cn(
                "flex flex-col gap-3 border-t border-gray-200 bg-white/80 py-6 sm:flex-row sm:flex-wrap sm:justify-end sm:gap-3",
                cardPadX,
              )}
            >
              <button type="button" className={btnPrimary} onClick={() => void cargar()}>
                Aplicar filtros
              </button>
              <button type="button" className={btnSecondary} onClick={limpiarFiltros}>
                Limpiar
              </button>
            </div>
          </div>
        ) : null}

        <div className="mt-6 border-t border-gray-200 bg-gray-50/50 pt-4 sm:mt-8 sm:pt-5">
          {lista.length > 0 ? (
            <>
          <div className="hidden overflow-x-auto px-4 pb-2 pt-2 [-webkit-overflow-scrolling:touch] sm:px-5 md:block">
            <table className="w-full min-w-[800px] text-left text-gray-600">
              <caption className="sr-only">Asuntos del estudio</caption>
              <thead>
                <tr className="border-b border-gray-200 bg-gray-100/95">
                  <th className="sticky left-0 z-20 w-[5.5rem] min-w-[5.5rem] border-r border-gray-200 bg-gray-100 py-2.5 pl-3 pr-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 shadow-[4px_0_12px_-6px_rgba(15,23,42,0.08)] sm:w-[6rem] sm:min-w-[6rem] sm:py-3 sm:pl-4 sm:pr-3 sm:text-sm">
                    Acción
                  </th>
                  <th className="whitespace-nowrap px-2 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 sm:px-3 sm:py-3 sm:text-sm">
                    #
                  </th>
                  <th className="px-2 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 sm:px-3 sm:py-3 sm:text-sm">Estado</th>
                  <th className="px-2 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 sm:px-3 sm:py-3 sm:text-sm">Tipo</th>
                  <th className="px-2 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 sm:px-3 sm:py-3 sm:text-sm">Cliente</th>
                  <th className="px-2 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 sm:px-3 sm:py-3 sm:text-sm">Asunto</th>
                  <th className="px-2 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 sm:px-3 sm:py-3 sm:text-sm">Socio</th>
                  <th className="px-2 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 sm:px-3 sm:py-3 sm:text-sm">Prof.</th>
                  <th className="px-2 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 sm:px-3 sm:py-3 sm:text-sm">Colab.</th>
                  <th className="px-2 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 sm:px-3 sm:py-3 sm:text-sm">Cont.</th>
                  <th className="px-2 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 sm:px-3 sm:py-3 sm:text-sm">Inicio</th>
                </tr>
              </thead>
              <tbody className="text-xs leading-snug sm:text-sm">
                {lista.map((a, rowIdx) => (
                  <tr
                    key={a.id}
                    className={cn(
                      "group border-b border-gray-100 transition-colors hover:bg-emerald-50/50",
                      rowIdx % 2 === 1 ? "bg-gray-50/60" : "bg-white",
                    )}
                  >
                    <td
                      className={cn(
                        "sticky left-0 z-10 border-r border-gray-100 py-2 align-middle pl-3 pr-2 shadow-[4px_0_12px_-6px_rgba(15,23,42,0.06)] sm:py-2.5 sm:pl-4 sm:pr-3",
                        rowIdx % 2 === 1 ? "bg-gray-50/95 group-hover:bg-emerald-50/60" : "bg-white group-hover:bg-emerald-50/50",
                      )}
                    >
                      <Link className={linkVerFicha} href={`/estudio/asuntos/${a.id}`}>
                        Ver ficha
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 font-mono text-xs tabular-nums text-gray-600 sm:px-3 sm:py-2.5">
                      {a.ordinal}
                    </td>
                    <td className="px-2 py-2 sm:px-3 sm:py-2.5">
                      <span
                        className={
                          a.estado === "FINALIZADO"
                            ? "inline-flex rounded-full bg-gray-200/80 px-1.5 py-0.5 text-[0.65rem] font-medium text-gray-700 sm:text-xs"
                            : "text-[0.65rem] font-semibold text-emerald-800 sm:text-xs"
                        }
                      >
                        {a.estado === "EN_TRAMITE" ? "En trámite" : "Finalizado"}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-gray-600 sm:px-3 sm:py-2.5">{etiquetaTipo(a.tipo)}</td>
                    <td className="max-w-[160px] px-2 py-2 sm:max-w-[180px] sm:px-3 sm:py-2.5">
                      <span className="font-medium text-gray-900">{a.cliente.nombre}</span>
                      <span className="mt-0.5 block truncate text-[0.65rem] text-gray-600 sm:text-xs">{a.cliente.documento}</span>
                    </td>
                    <td className="max-w-[160px] truncate px-2 py-2 text-gray-900 sm:max-w-[180px] sm:px-3 sm:py-2.5" title={a.catalogo.nombre}>
                      {a.catalogo.nombre}
                    </td>
                    <td className="max-w-[100px] truncate px-2 py-2 text-gray-600 sm:max-w-[110px] sm:px-3 sm:py-2.5" title={a.socioReferente?.nombre}>
                      {a.socioReferente?.nombre ?? "—"}
                    </td>
                    <td className="max-w-[100px] truncate px-2 py-2 text-gray-600 sm:max-w-[110px] sm:px-3 sm:py-2.5" title={a.profesionalACargo?.nombre}>
                      {a.profesionalACargo?.nombre ?? "—"}
                    </td>
                    <td className="max-w-[120px] truncate px-2 py-2 text-gray-600 sm:max-w-[130px] sm:px-3 sm:py-2.5" title={textoColaboradores(a) === "—" ? undefined : textoColaboradores(a)}>
                      {textoColaboradores(a)}
                    </td>
                    <td className="max-w-[90px] truncate px-2 py-2 text-gray-600 sm:px-3 sm:py-2.5" title={a.contadorReferente?.nombre}>
                      {a.contadorReferente?.nombre ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 tabular-nums text-gray-600 sm:px-3 sm:py-2.5">{fmtFechaCorta(a.fechaInicio)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className={`flex flex-col gap-4 bg-transparent pb-4 pt-2 md:hidden ${cardPadX}`}>
            {lista.map((a) => (
              <li
                key={a.id}
                className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm ring-1 ring-black/[0.02] transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold tabular-nums text-gray-500">#{a.ordinal}</span>
                      <span
                        className={
                          a.estado === "FINALIZADO"
                            ? "rounded-full bg-gray-100 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-gray-600"
                            : "text-[0.65rem] font-semibold uppercase tracking-wide text-emerald-800"
                        }
                      >
                        {a.estado === "EN_TRAMITE" ? "En trámite" : "Finalizado"}
                      </span>
                    </div>
                    <p className="mt-2 text-base font-semibold leading-snug text-gray-900">{a.catalogo.nombre}</p>
                    <p className="mt-1 text-sm text-gray-700">{a.cliente.nombre}</p>
                    <p className="text-xs text-gray-500">{a.cliente.documento}</p>
                  </div>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs text-gray-600">
                  <div>
                    <dt className="font-semibold text-gray-500">Tipo</dt>
                    <dd className="mt-0.5">{etiquetaTipo(a.tipo)}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-gray-500">Inicio</dt>
                    <dd className="mt-0.5 tabular-nums">{fmtFechaCorta(a.fechaInicio)}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="font-semibold text-gray-500">Socio</dt>
                    <dd className="mt-0.5 truncate">{a.socioReferente?.nombre ?? "—"}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="font-semibold text-gray-500">Prof. / Colab. / Cont.</dt>
                    <dd className="mt-0.5 line-clamp-2">
                      {[a.profesionalACargo?.nombre, textoColaboradores(a), a.contadorReferente?.nombre]
                        .filter((x) => x && x !== "—")
                        .join(" · ") || "—"}
                    </dd>
                  </div>
                </dl>
                <Link className={cn(linkVerFicha, "mt-4 block text-center")} href={`/estudio/asuntos/${a.id}`}>
                  Ver ficha
                </Link>
              </li>
            ))}
          </ul>
            </>
          ) : !cargando ? (
            <div className={`bg-white py-14 text-center sm:py-16 ${cardPadX}`}>
              <p className="text-base font-bold text-gray-900">Sin resultados</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-gray-600">
                {hayFiltrosActivos ? "Probá otros filtros o limpiá la búsqueda." : "Creá un asunto con Nuevo asunto (arriba a la derecha)."}
              </p>
              {hayFiltrosActivos ? (
                <button
                  type="button"
                  className={`${btnGhost} mt-6 text-emerald-700 hover:bg-emerald-50`}
                  onClick={limpiarFiltros}
                >
                  Limpiar filtros
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {mensaje ? (
        <div className="rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-950">{mensaje}</div>
      ) : null}
    </div>
  );
}
