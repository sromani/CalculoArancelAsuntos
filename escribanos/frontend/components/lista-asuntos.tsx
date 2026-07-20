"use client";

import Link from "next/link";
import { EstudioButton } from "@/components/ui/estudio-button";
import { useCallback, useEffect, useMemo, useState } from "react";

import { estudioTw } from "@/lib/estudio-tw";
import { cn } from "@/lib/cn";

const inputBase = estudioTw.inputSm;
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
        checked ? "bg-emerald-600" : "bg-neutral-200"
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

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3-3" strokeLinecap="round" />
    </svg>
  );
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
  const [busquedaAvanzada, setBusquedaAvanzada] = useState(false);

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
    <div className={cn("flex w-full min-w-0 flex-col text-left", estudioTw.listStackY)}>
      <div className="panel overflow-hidden">
        <div className="page-toolbar page-toolbar-wide">
          <div className="min-w-0 shrink-0">
            <h1 className="page-title">Listado de Asuntos</h1>
          </div>
          <div className="page-toolbar-end">
            <div className="search-field max-w-full">
              <label htmlFor="busqueda-asuntos">Buscar</label>
              <div className="search-field-inner">
                <span className="search-icon" aria-hidden>
                  <SearchIcon />
                </span>
                <input
                  id="busqueda-asuntos"
                  type="search"
                  className="search-input"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Nombre, nº carpeta, escribano…"
                  autoComplete="off"
                />
                {q ? (
                  <button
                    type="button"
                    className="search-clear"
                    aria-label="Limpiar búsqueda"
                    onClick={() => setQ("")}
                  >
                    ×
                  </button>
                ) : null}
              </div>
            </div>
            <EstudioButton
              type="button"
              variant="secondarySm"
              className="shrink-0 self-end"
              aria-expanded={busquedaAvanzada}
              onClick={() => setBusquedaAvanzada((v) => !v)}
            >
              <span className="hidden sm:inline">{busquedaAvanzada ? "Ocultar filtros" : "Más filtros"}</span>
              <span className="sm:hidden">{busquedaAvanzada ? "Ocultar" : "Filtros"}</span>
            </EstudioButton>
          </div>
        </div>

        <div className="asuntos-meta-bar">
          {filtrosActivosCount > 0 ? (
            <div className={estudioTw.listBannerFiltros}>
              <span className="font-semibold text-neutral-900">Filtros activos:</span>{" "}
              <span className="tabular-nums text-neutral-800">{filtrosActivosCount}</span> criterio
              {filtrosActivosCount === 1 ? "" : "s"}
            </div>
          ) : null}

          {cargando ? (
            <span className="muted inline-flex items-center gap-2 text-sm font-medium">
              <span className={estudioTw.listSpinner} aria-hidden />
              Actualizando
            </span>
          ) : null}

          {hayFiltrosActivos ? (
            <button type="button" className={btnGhost} onClick={limpiarFiltros}>
              Limpiar filtros
            </button>
          ) : null}
        </div>

        {busquedaAvanzada ? (
          <div className="asuntos-filtros">
            <p className="asuntos-filtros-intro">
              Afina el listado por estado, equipo, pendientes o fechas. Los valores se mantienen al cerrar el panel.
            </p>

            <div className="asuntos-filtro-bloque">
              <h3>Criterios del asunto</h3>
              <p>Situación del expediente y tipo de actuación.</p>
              <div className="asuntos-filtro-grid">
                <div className="asuntos-filtro-campo">
                  <label htmlFor="filtro-estado">Estado</label>
                  <select
                    id="filtro-estado"
                    className={inputBase}
                    value={estado}
                    onChange={(e) => setEstado(e.target.value)}
                  >
                    <option value="">Todos</option>
                    <option value="EN_TRAMITE">En trámite</option>
                    <option value="FINALIZADO">Finalizado</option>
                  </select>
                </div>
                <div className="asuntos-filtro-campo">
                  <label htmlFor="filtro-tipo">Tipo</label>
                  <select
                    id="filtro-tipo"
                    className={inputBase}
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                  >
                    <option value="">Todos</option>
                    <option value="TODOS">Todos (catálogo)</option>
                    <option value="NOTARIAL">Notarial</option>
                    <option value="LEGAL">Legal</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="asuntos-filtro-bloque">
              <h3>Equipo</h3>
              <p>Legal a cargo y socio referente del expediente.</p>
              <div className="asuntos-filtro-grid">
                <div className="asuntos-filtro-campo">
                  <label htmlFor="filtro-legal">Legal a cargo</label>
                  <select
                    id="filtro-legal"
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
                </div>
                <div className="asuntos-filtro-campo">
                  <label htmlFor="filtro-socio">Socio referente</label>
                  <select
                    id="filtro-socio"
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
                </div>
              </div>
            </div>

            <div className="asuntos-filtro-bloque">
              <h3>Pendientes</h3>
              <p>Solo expedientes sin colaboradores o sin contador referente.</p>
              <div className="asuntos-filtro-toggles">
                <div className="asuntos-filtro-toggle">
                  <ToggleSwitch
                    id="filtro-sin-equipo"
                    ariaLabel="Filtrar asuntos sin colaboradores"
                    checked={sinEquipo}
                    onChange={setSinEquipo}
                  />
                  <span>Sin colaboradores</span>
                </div>
                <div className="asuntos-filtro-toggle">
                  <ToggleSwitch
                    id="filtro-sin-contador"
                    ariaLabel="Filtrar asuntos sin contador"
                    checked={sinContador}
                    onChange={setSinContador}
                  />
                  <span>Sin contador</span>
                </div>
              </div>
            </div>

            <div className="asuntos-filtro-bloque">
              <h3>Fechas</h3>
              <p>Año o rango de inicio y finalización del expediente.</p>
              <div className="asuntos-filtro-grid asuntos-filtro-grid--3">
                <div className="asuntos-filtro-campo">
                  <label htmlFor="filtro-anio">Año inicio</label>
                  <input
                    id="filtro-anio"
                    className={inputBase}
                    value={anioInicio}
                    onChange={(e) => setAnioInicio(e.target.value)}
                    placeholder="Ej. 2026"
                    inputMode="numeric"
                  />
                </div>
                <div className="asuntos-filtro-campo">
                  <label htmlFor="filtro-inicio-desde">Inicio desde</label>
                  <input
                    id="filtro-inicio-desde"
                    className={inputBase}
                    type="date"
                    value={fechaInicioDesde}
                    onChange={(e) => setFechaInicioDesde(e.target.value)}
                  />
                </div>
                <div className="asuntos-filtro-campo">
                  <label htmlFor="filtro-inicio-hasta">Inicio hasta</label>
                  <input
                    id="filtro-inicio-hasta"
                    className={inputBase}
                    type="date"
                    value={fechaInicioHasta}
                    onChange={(e) => setFechaInicioHasta(e.target.value)}
                  />
                </div>
                <div className="asuntos-filtro-campo">
                  <label htmlFor="filtro-fin-desde">Finalización desde</label>
                  <input
                    id="filtro-fin-desde"
                    className={inputBase}
                    type="date"
                    value={fechaFinalizacionDesde}
                    onChange={(e) => setFechaFinalizacionDesde(e.target.value)}
                  />
                </div>
                <div className="asuntos-filtro-campo">
                  <label htmlFor="filtro-fin-hasta">Finalización hasta</label>
                  <input
                    id="filtro-fin-hasta"
                    className={inputBase}
                    type="date"
                    value={fechaFinalizacionHasta}
                    onChange={(e) => setFechaFinalizacionHasta(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="asuntos-filtros-acciones">
              <button type="button" className="btn btn-secondary" onClick={limpiarFiltros}>
                Limpiar
              </button>
              <button type="button" className="btn btn-primary" onClick={() => void cargar()}>
                Aplicar filtros
              </button>
            </div>
          </div>
        ) : null}

        <div className="border-t border-neutral-100 pb-2 pt-6">
          {lista.length > 0 ? (
            <>
          <div className="hidden overflow-x-auto pb-2 pt-2 [-webkit-overflow-scrolling:touch] md:block">
            <table className="data w-full min-w-[800px] text-left text-neutral-700">
              <caption className="sr-only">Asuntos del estudio</caption>
              <thead>
                <tr>
                  <th
                    className={cn(
                      "sticky left-0 z-20 w-[5.5rem] min-w-[5.5rem] border-r border-neutral-200 bg-neutral-50 text-left font-semibold text-emerald-800 shadow-[4px_0_12px_-6px_rgba(15,23,42,0.08)] sm:w-[6rem] sm:min-w-[6rem]",
                    )}
                  >
                    Acción
                  </th>
                  <th className="whitespace-nowrap">#</th>
                  <th>Estado</th>
                  <th>Tipo</th>
                  <th>Cliente</th>
                  <th>Asunto</th>
                  <th>Socio</th>
                  <th>Prof.</th>
                  <th>Colab.</th>
                  <th>Cont.</th>
                  <th>Inicio</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((a, rowIdx) => (
                  <tr
                    key={a.id}
                    className={cn(
                      "group transition-colors",
                      rowIdx % 2 === 1 ? "bg-neutral-50/70" : "bg-white",
                    )}
                  >
                    <td
                      className={cn(
                        "sticky left-0 z-10 border-r border-neutral-100 align-middle shadow-[4px_0_12px_-6px_rgba(15,23,42,0.06)]",
                        rowIdx % 2 === 1 ? "bg-neutral-50/95 group-hover:bg-emerald-50/45" : "bg-white group-hover:bg-emerald-50/35",
                      )}
                    >
                      <Link className={linkVerFicha} href={`/estudio/asuntos/${a.id}`}>
                        Ver ficha
                      </Link>
                    </td>
                    <td className="whitespace-nowrap font-mono tabular-nums text-neutral-600">{a.ordinal}</td>
                    <td>
                      <span
                        className={
                          a.estado === "FINALIZADO"
                            ? estudioTw.badgeNeutralSoft
                            : "text-sm font-semibold text-emerald-800"
                        }
                      >
                        {a.estado === "EN_TRAMITE" ? "En trámite" : "Finalizado"}
                      </span>
                    </td>
                    <td className="text-neutral-600">{etiquetaTipo(a.tipo)}</td>
                    <td className="max-w-[160px] sm:max-w-[180px]">
                      <span className="font-medium text-neutral-900">{a.cliente.nombre}</span>
                      <span className="mt-1 block truncate text-sm text-neutral-600">{a.cliente.documento}</span>
                    </td>
                    <td className="max-w-[160px] truncate font-medium text-neutral-900 sm:max-w-[180px]" title={a.catalogo.nombre}>
                      {a.catalogo.nombre}
                    </td>
                    <td className="max-w-[100px] truncate text-neutral-600 sm:max-w-[110px]" title={a.socioReferente?.nombre}>
                      {a.socioReferente?.nombre ?? "—"}
                    </td>
                    <td className="max-w-[100px] truncate text-neutral-600 sm:max-w-[110px]" title={a.profesionalACargo?.nombre}>
                      {a.profesionalACargo?.nombre ?? "—"}
                    </td>
                    <td className="max-w-[120px] truncate text-neutral-600 sm:max-w-[130px]" title={textoColaboradores(a) === "—" ? undefined : textoColaboradores(a)}>
                      {textoColaboradores(a)}
                    </td>
                    <td className="max-w-[90px] truncate text-neutral-600" title={a.contadorReferente?.nombre}>
                      {a.contadorReferente?.nombre ?? "—"}
                    </td>
                    <td className="whitespace-nowrap tabular-nums text-neutral-600">{fmtFechaCorta(a.fechaInicio)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="flex flex-col gap-4 bg-transparent py-4 md:hidden">
            {lista.map((a) => (
              <li
                key={a.id}
                className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm ring-1 ring-black/[0.02] transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4 border-b border-neutral-100 pb-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold tabular-nums text-neutral-500">#{a.ordinal}</span>
                      <span
                        className={
                          a.estado === "FINALIZADO"
                            ? estudioTw.badgeNeutralSoft
                            : "text-xs font-semibold uppercase tracking-wide text-emerald-800"
                        }
                      >
                        {a.estado === "EN_TRAMITE" ? "En trámite" : "Finalizado"}
                      </span>
                    </div>
                    <p className="mt-2 text-base font-semibold leading-snug text-neutral-900">{a.catalogo.nombre}</p>
                    <p className="mt-2 text-sm text-neutral-700">{a.cliente.nombre}</p>
                    <p className="mt-1 text-xs text-neutral-500">{a.cliente.documento}</p>
                  </div>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-neutral-600">
                  <div>
                    <dt className={estudioTw.typeListDlDt}>Tipo</dt>
                    <dd className={estudioTw.typeListDlDd}>{etiquetaTipo(a.tipo)}</dd>
                  </div>
                  <div>
                    <dt className={estudioTw.typeListDlDt}>Inicio</dt>
                    <dd className={cn(estudioTw.typeListDlDd, "tabular-nums")}>{fmtFechaCorta(a.fechaInicio)}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className={estudioTw.typeListDlDt}>Socio</dt>
                    <dd className={cn(estudioTw.typeListDlDd, "truncate")}>{a.socioReferente?.nombre ?? "—"}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className={estudioTw.typeListDlDt}>Prof. / Colab. / Cont.</dt>
                    <dd className={cn(estudioTw.typeListDlDd, "line-clamp-2")}>
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
            <div className="bg-white py-12 text-center sm:py-16">
              <p className={estudioTw.typeListTitle}>Sin resultados</p>
              <p className={cn(estudioTw.typeListBody, "muted mx-auto max-w-md")}>
                {hayFiltrosActivos ? "Probá otros filtros o limpiá la búsqueda." : "Todavía no hay asuntos, o usá Nuevo Asunto desde el menú de Asuntos."}
              </p>
              {hayFiltrosActivos ? (
                <button
                  type="button"
                  className={cn(btnGhost, "mt-8 text-emerald-700 hover:bg-emerald-50")}
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
