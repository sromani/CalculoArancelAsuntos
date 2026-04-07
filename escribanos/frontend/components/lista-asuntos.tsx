"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

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

type RolMe =
  | "ADMIN"
  | "USUARIO"
  | "SOCIO"
  | "PROFESIONAL"
  | "COLABORADOR"
  | "CONTADOR"
  | "SOLO_LECTURA";

const panel = "rounded-lg bg-white p-6 sm:p-8";

const labelMin = "mb-1.5 block text-xs font-medium uppercase tracking-wide text-neutral-500";

const seccionFiltro = "space-y-4 border-t border-neutral-100 pt-6 first:border-0 first:pt-0";

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

function profesionalDesdeDescripcion(descripcion: string | null | undefined): string | null {
  const s = String(descripcion ?? "");
  const m = s.match(/\[PROFESIONAL_A_CARGO_LIBRE\]:\s*(.+)/i);
  return m?.[1]?.trim() || null;
}

function nombreProfesionalMostrado(a: AsuntoRow): string {
  return a.profesionalACargo?.nombre ?? profesionalDesdeDescripcion(a.descripcion) ?? "—";
}

export function ListaAsuntos() {
  const [estado, setEstado] = useState<string>("");
  const [tipo, setTipo] = useState<string>("");
  const [profesionalACargoId, setProfesionalACargoId] = useState<string>("");
  const [anioInicio, setAnioInicio] = useState<string>("");
  const [fechaInicioDesde, setFechaInicioDesde] = useState<string>("");
  const [fechaInicioHasta, setFechaInicioHasta] = useState<string>("");
  const [fechaFinalizacionDesde, setFechaFinalizacionDesde] = useState<string>("");
  const [fechaFinalizacionHasta, setFechaFinalizacionHasta] = useState<string>("");
  const [profesionales, setProfesionales] = useState<ProfesionalFiltro[]>([]);
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
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
          anioInicio ||
          fechaInicioDesde ||
          fechaInicioHasta ||
          fechaFinalizacionDesde ||
          fechaFinalizacionHasta ||
          debounced,
      ),
    [
      estado,
      tipo,
      profesionalACargoId,
      anioInicio,
      fechaInicioDesde,
      fechaInicioHasta,
      fechaFinalizacionDesde,
      fechaFinalizacionHasta,
      debounced,
    ],
  );

  function limpiarFiltros() {
    setEstado("");
    setTipo("");
    setProfesionalACargoId("");
    setAnioInicio("");
    setFechaInicioDesde("");
    setFechaInicioHasta("");
    setFechaFinalizacionDesde("");
    setFechaFinalizacionHasta("");
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
      })
      .catch(() => {
        setProfesionales([]);
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
      if (anioInicio) params.set("anioInicio", anioInicio);
      if (fechaInicioDesde) params.set("fechaInicioDesde", fechaInicioDesde);
      if (fechaInicioHasta) params.set("fechaInicioHasta", fechaInicioHasta);
      if (fechaFinalizacionDesde) params.set("fechaFinalizacionDesde", fechaFinalizacionDesde);
      if (fechaFinalizacionHasta) params.set("fechaFinalizacionHasta", fechaFinalizacionHasta);
      if (debounced) params.set("q", debounced);
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
    anioInicio,
    fechaInicioDesde,
    fechaInicioHasta,
    fechaFinalizacionDesde,
    fechaFinalizacionHasta,
  ]);

  useEffect(() => {
    void cargar().catch(() => setCargando(false));
  }, [cargar]);

  return (
    <div className="min-w-0 space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-neutral-600">
          <span className="text-neutral-400">Rol</span> {rol ?? "…"}
          {!cargando ? (
            <>
              {" "}
              <span className="text-neutral-300">·</span>{" "}
              <span className="tabular-nums text-[var(--verde-titulo)]">
                {lista.length} {lista.length === 1 ? "resultado" : "resultados"}
              </span>
            </>
          ) : null}
        </p>
        {hayFiltrosActivos ? (
          <button
            type="button"
            className="inline-flex min-h-[2.75rem] items-center justify-center rounded-[10px] bg-white px-5 py-2 text-sm font-semibold text-[var(--gris-texto)] shadow-sm ring-1 ring-black/[0.06] transition-colors hover:bg-[var(--fondo-verde-muy-claro)] hover:ring-black/[0.1]"
            onClick={limpiarFiltros}
          >
            Limpiar filtros
          </button>
        ) : null}
      </div>

      <div className={panel}>
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">Filtros</p>
        <div className="mt-6 space-y-8">
          <div className={seccionFiltro}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className="lg:col-span-2">
                <span className={labelMin}>Buscar</span>
                <input
                  className="input-app"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Cliente, documento, asunto…"
                />
              </label>
              <label>
                <span className={labelMin}>Estado</span>
                <select className="input-app" value={estado} onChange={(e) => setEstado(e.target.value)}>
                  <option value="">Todos</option>
                  <option value="EN_TRAMITE">En trámite</option>
                  <option value="FINALIZADO">Finalizado</option>
                </select>
              </label>
              <label>
                <span className={labelMin}>Tipo</span>
                <select className="input-app" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                  <option value="">Todos</option>
                  <option value="TODOS">Todos (catálogo)</option>
                  <option value="NOTARIAL">Notarial</option>
                  <option value="LEGAL">Legal</option>
                </select>
              </label>
            </div>
          </div>

          <div className={seccionFiltro}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className={labelMin}>Profesional a cargo</span>
                <select
                  className="input-app"
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
            </div>
          </div>

          <div className={seccionFiltro}>
            <p className="mb-4 text-xs font-medium uppercase tracking-wide text-neutral-400">Fechas</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label>
                <span className={labelMin}>Año inicio</span>
                <input
                  className="input-app"
                  value={anioInicio}
                  onChange={(e) => setAnioInicio(e.target.value)}
                  placeholder="Ej. 2026"
                  inputMode="numeric"
                />
              </label>
              <label>
                <span className={labelMin}>Inicio desde</span>
                <input className="input-app" type="date" value={fechaInicioDesde} onChange={(e) => setFechaInicioDesde(e.target.value)} />
              </label>
              <label>
                <span className={labelMin}>Inicio hasta</span>
                <input className="input-app" type="date" value={fechaInicioHasta} onChange={(e) => setFechaInicioHasta(e.target.value)} />
              </label>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label>
                <span className={labelMin}>Finalización desde</span>
                <input
                  className="input-app"
                  type="date"
                  value={fechaFinalizacionDesde}
                  onChange={(e) => setFechaFinalizacionDesde(e.target.value)}
                />
              </label>
              <label>
                <span className={labelMin}>Finalización hasta</span>
                <input
                  className="input-app"
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
        <div className="rounded-lg bg-neutral-50/50 px-6 py-12 text-center">
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
          <div className="hidden min-w-0 overflow-hidden rounded-lg bg-white md:block">
            <div className="overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
              <table className="w-full min-w-[960px] text-left text-sm text-neutral-800">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50/80">
                    <th className="sticky left-0 z-20 bg-neutral-50 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.06)]">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">Cliente</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">Asunto</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">Prof.</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">Inicio</th>
                    <th className="sticky right-0 z-30 min-w-[7.5rem] border-l border-neutral-200 bg-neutral-50 px-3 py-3 text-right text-xs font-medium uppercase tracking-wide text-neutral-500 shadow-[-6px_0_12px_-4px_rgba(0,0,0,0.06)]">
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
                      <td className="sticky left-0 z-10 bg-white px-4 py-3 font-mono text-xs tabular-nums text-neutral-500 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)] group-hover:bg-[rgba(0,166,81,0.04)]">
                        {a.ordinal}
                      </td>
                      <td className="px-4 py-3">
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
                      <td className="px-4 py-3 text-neutral-600">{etiquetaTipo(a.tipo)}</td>
                      <td className="max-w-[200px] px-4 py-3">
                        <span className="font-medium text-neutral-900">{a.cliente.nombre}</span>
                        <span className="mt-0.5 block truncate text-xs text-neutral-500">{a.cliente.documento}</span>
                      </td>
                      <td className="max-w-[200px] truncate px-4 py-3 text-neutral-900" title={a.catalogo.nombre}>
                        {a.catalogo.nombre}
                      </td>
                      <td
                        className="max-w-[120px] truncate px-4 py-3 text-neutral-600"
                        title={nombreProfesionalMostrado(a) !== "—" ? nombreProfesionalMostrado(a) : undefined}
                      >
                        {nombreProfesionalMostrado(a)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 tabular-nums text-neutral-600">{fmtFechaCorta(a.fechaInicio)}</td>
                      <td className="sticky right-0 z-10 min-w-[7.5rem] border-l border-neutral-100 bg-white px-3 py-3 text-right shadow-[-8px_0_14px_-6px_rgba(0,0,0,0.07)] group-hover:bg-[rgba(0,166,81,0.04)]">
                        <Link
                          className="inline-flex min-h-[2.25rem] min-w-[6.25rem] items-center justify-center rounded-lg bg-[var(--verde-principal)] px-3 py-1.5 text-xs font-semibold text-white shadow-sm ring-1 ring-black/[0.04] transition-colors hover:bg-[var(--verde-oscuro)] sm:text-sm"
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
              <li key={a.id} className="rounded-xl bg-white p-4">
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
                      className="inline-flex min-h-[2.5rem] min-w-[6.5rem] items-center justify-center rounded-lg bg-[var(--verde-principal)] px-3 py-2 text-center text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--verde-oscuro)]"
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
                    <dt className="text-neutral-400">Prof.</dt>
                    <dd className="min-w-0 truncate text-right">{nombreProfesionalMostrado(a)}</dd>
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
