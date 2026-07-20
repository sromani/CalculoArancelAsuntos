"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { estudioTw } from "@/lib/estudio-tw";
import {
  ETIQUETA_TIPO_SOCIAL_CLIENTE,
  etiquetaEstadoCivil,
  etiquetaTipoDocumentoCliente,
  etiquetaTipoPersonaCliente,
  esTipoSocialCliente,
} from "@/lib/validaciones";

type ClienteRow = {
  id: string;
  nombre: string;
  documento: string;
  tipoDocumento: string;
  tipoPersona: string;
  tipoSocial?: string | null;
  fechaNacimiento: string | null;
  estadoCivil: string | null;
  domicilio: string | null;
  telefono: string | null;
  email: string | null;
  contacto: string | null;
};

function fmtFechaNac(iso: string | null | undefined): string {
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

function etiquetaTipoSocial(codigo: string | null | undefined): string {
  if (!codigo) return "—";
  const u = codigo.toUpperCase();
  return esTipoSocialCliente(u) ? ETIQUETA_TIPO_SOCIAL_CLIENTE[u] : codigo;
}

type Props = {
  refreshKey?: number;
};

/** Enlace “Editar” (texto verde + subrayado), sin aspecto de botón sólido. */
const linkEditarCliente =
  "font-semibold text-emerald-700 underline decoration-emerald-600/35 underline-offset-2 transition hover:text-emerald-800 hover:decoration-emerald-700 focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600";

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3-3" strokeLinecap="round" />
    </svg>
  );
}

export function PanelBusquedaClientes({ refreshKey = 0 }: Props) {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [lista, setLista] = useState<ClienteRow[]>([]);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 320);
    return () => clearTimeout(t);
  }, [q]);

  const cargar = useCallback(async () => {
    setCargando(true);
    setMensaje("");
    try {
      const qs = debounced ? `?q=${encodeURIComponent(debounced)}` : "";
      const response = await fetch(`/api/clientes${qs}`);
      const data = await response.json();
      if (!response.ok) {
        setMensaje(data?.error ?? "No se pudo cargar clientes.");
        setLista([]);
        return;
      }
      setLista(data as ClienteRow[]);
    } catch {
      setMensaje("Error de conexión.");
      setLista([]);
    } finally {
      setCargando(false);
    }
  }, [debounced]);

  useEffect(() => {
    void cargar().catch(() => setCargando(false));
  }, [cargar, refreshKey]);

  const busquedaActiva = debounced.length > 0;

  return (
    <div className={cn("w-full min-w-0", estudioTw.listStackY)}>
      <div className="panel overflow-hidden">
        <div className="page-toolbar page-toolbar-wide">
          <div className="min-w-0 shrink-0">
            <h1 className="page-title">Directorio de Clientes</h1>
          </div>
          <div className="page-toolbar-end">
            <div className="search-field max-w-full">
              <label htmlFor="busqueda-clientes">Buscar</label>
              <div className="search-field-inner">
                <span className="search-icon" aria-hidden>
                  <SearchIcon />
                </span>
                <input
                  id="busqueda-clientes"
                  type="search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Nombre, documento o teléfono…"
                  autoComplete="off"
                  className="search-input"
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
          </div>
        </div>

        <p className="search-meta muted">
          {cargando ? (
            <span className="inline-flex items-center gap-2">
              <span className={estudioTw.listSpinner} aria-hidden />
              Actualizando
            </span>
          ) : busquedaActiva ? (
            <>
              <span className="tabular-nums text-neutral-800">{lista.length}</span>
              {lista.length === 1 ? " coincidencia" : " coincidencias"}
            </>
          ) : (
            <>
              <span className="tabular-nums text-neutral-800">{lista.length}</span>
              {lista.length === 1 ? " cliente" : " clientes"}
              {lista.length >= 500 ? " · máx. mostrados" : ""}
            </>
          )}
        </p>

        <div className="border-t border-neutral-100 pb-2 pt-4">
          {lista.length > 0 ? (
            <>
              <div className="hidden md:block">
                <div className="overflow-x-auto pb-2 pt-2">
                  <table className="data w-full min-w-[980px] text-left text-neutral-700">
                    <caption className="sr-only">Clientes del estudio</caption>
                    <thead>
                      <tr>
                        <th
                          className={cn(
                            "sticky left-0 z-20 w-[3.5rem] min-w-[3.5rem] border-r border-neutral-200 bg-neutral-50 text-left font-semibold text-emerald-800 shadow-[4px_0_12px_-6px_rgba(15,23,42,0.06)]",
                          )}
                        >
                          Editar
                        </th>
                        <th>Cliente</th>
                        <th>Tipo doc.</th>
                        <th>Número</th>
                        <th>Domicilio</th>
                        <th>Persona</th>
                        <th>Tipo social</th>
                        <th>Nacimiento</th>
                        <th>Estado civil</th>
                        <th>Teléfono</th>
                        <th>Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lista.map((c, i) => (
                        <tr
                          key={c.id}
                          className={cn(
                            "transition-colors",
                            i % 2 === 1 ? "bg-neutral-50/80" : "bg-white",
                          )}
                        >
                          <td
                            className={cn(
                              "sticky left-0 z-10 border-r border-neutral-100 align-middle shadow-[4px_0_12px_-6px_rgba(15,23,42,0.05)]",
                              i % 2 === 1 ? "bg-neutral-50/95" : "bg-white",
                            )}
                          >
                            <Link
                              href={`/estudio/clientes/${c.id}/editar`}
                              className={cn(linkEditarCliente, "inline-block text-xs")}
                            >
                              Editar
                            </Link>
                          </td>
                          <td>
                            <p className="min-w-0 text-sm font-semibold leading-snug text-neutral-900">{c.nombre}</p>
                          </td>
                          <td className="whitespace-nowrap font-medium text-emerald-800">
                            {etiquetaTipoDocumentoCliente(c.tipoDocumento)}
                          </td>
                          <td className="whitespace-nowrap tabular-nums text-neutral-800">{c.documento}</td>
                          <td className="max-w-[10rem] text-neutral-600" title={c.domicilio?.trim() || undefined}>
                            {c.domicilio?.trim() || "—"}
                          </td>
                          <td className="whitespace-nowrap text-neutral-800">
                            {etiquetaTipoPersonaCliente(c.tipoPersona)}
                          </td>
                          <td
                            className="max-w-[7rem] truncate text-neutral-600"
                            title={c.tipoSocial ? etiquetaTipoSocial(c.tipoSocial) : undefined}
                          >
                            {c.tipoPersona === "JURIDICA" && c.tipoSocial ? etiquetaTipoSocial(c.tipoSocial) : "—"}
                          </td>
                          <td className="whitespace-nowrap tabular-nums text-neutral-600">
                            {c.tipoPersona === "FISICA" ? fmtFechaNac(c.fechaNacimiento) : "—"}
                          </td>
                          <td
                            className="max-w-[6.5rem] truncate text-neutral-600"
                            title={c.tipoPersona === "FISICA" ? etiquetaEstadoCivil(c.estadoCivil) : undefined}
                          >
                            {c.tipoPersona === "FISICA" ? etiquetaEstadoCivil(c.estadoCivil) : "—"}
                          </td>
                          <td className="max-w-[6.5rem] truncate text-neutral-600" title={c.telefono ?? undefined}>
                            {c.telefono?.trim() || "—"}
                          </td>
                          <td className="max-w-[8rem] truncate text-neutral-600" title={c.email ?? undefined}>
                            {c.email?.trim() || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <ul className="flex flex-col gap-4 py-4 md:hidden">
                {lista.map((c) => (
                  <li
                    key={c.id}
                    className="rounded-xl border border-neutral-200/90 bg-white p-4 shadow-sm ring-1 ring-black/[0.02]"
                  >
                    <div className="flex gap-4">
                      <Link href={`/estudio/clientes/${c.id}/editar`} className={cn(linkEditarCliente, "shrink-0 self-start text-xs")}>
                        Editar
                      </Link>
                      <dl className="min-w-0 flex-1 grid grid-cols-1 gap-x-4 gap-y-2 text-xs leading-snug sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <dt className={estudioTw.typeListDlDt}>Nombre</dt>
                          <dd className={cn(estudioTw.typeListDlDd, "font-semibold text-neutral-900")}>{c.nombre}</dd>
                        </div>
                        <div>
                          <dt className={estudioTw.typeListDlDt}>Tipo doc.</dt>
                          <dd className={cn(estudioTw.typeListDlDd, "font-medium text-emerald-800")}>{etiquetaTipoDocumentoCliente(c.tipoDocumento)}</dd>
                        </div>
                        <div>
                          <dt className={estudioTw.typeListDlDt}>Número</dt>
                          <dd className={cn(estudioTw.typeListDlDd, "tabular-nums text-neutral-800")}>{c.documento}</dd>
                        </div>
                        <div className="sm:col-span-2">
                          <dt className={estudioTw.typeListDlDt}>Domicilio</dt>
                          <dd className={cn(estudioTw.typeListDlDd, "text-neutral-700")}>{c.domicilio?.trim() || "—"}</dd>
                        </div>
                        <div>
                          <dt className={estudioTw.typeListDlDt}>Persona</dt>
                          <dd className={cn(estudioTw.typeListDlDd, "text-neutral-800")}>{etiquetaTipoPersonaCliente(c.tipoPersona)}</dd>
                        </div>
                        <div>
                          <dt className={estudioTw.typeListDlDt}>Tipo social</dt>
                          <dd className={cn(estudioTw.typeListDlDd, "text-neutral-700")}>
                            {c.tipoPersona === "JURIDICA" && c.tipoSocial ? etiquetaTipoSocial(c.tipoSocial) : "—"}
                          </dd>
                        </div>
                        <div>
                          <dt className={estudioTw.typeListDlDt}>Nacimiento</dt>
                          <dd className={cn(estudioTw.typeListDlDd, "tabular-nums text-neutral-700")}>
                            {c.tipoPersona === "FISICA" ? fmtFechaNac(c.fechaNacimiento) : "—"}
                          </dd>
                        </div>
                        <div>
                          <dt className={estudioTw.typeListDlDt}>Estado civil</dt>
                          <dd className={cn(estudioTw.typeListDlDd, "text-neutral-700")}>
                            {c.tipoPersona === "FISICA" ? etiquetaEstadoCivil(c.estadoCivil) : "—"}
                          </dd>
                        </div>
                        <div>
                          <dt className={estudioTw.typeListDlDt}>Teléfono</dt>
                          <dd className={cn(estudioTw.typeListDlDd, "text-neutral-700")}>{c.telefono?.trim() || "—"}</dd>
                        </div>
                        <div className="sm:col-span-2">
                          <dt className={estudioTw.typeListDlDt}>Email</dt>
                          <dd className={cn(estudioTw.typeListDlDd, "break-all text-neutral-700")}>{c.email?.trim() || "—"}</dd>
                        </div>
                      </dl>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          ) : !cargando ? (
            <div className="bg-white py-12 text-center sm:py-16">
              <p className={estudioTw.typeListTitle}>Sin resultados</p>
              <p className={cn(estudioTw.typeListBody, "muted mx-auto max-w-md")}>
                {busquedaActiva
                  ? "Probá con otra palabra, parte del documento o del teléfono."
                  : "Todavía no hay clientes, o usá Nuevo Cliente desde el menú de Clientes."}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {mensaje ? (
        <div
          className="rounded-xl border border-amber-200/90 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          role="alert"
        >
          {mensaje}
        </div>
      ) : null}
    </div>
  );
}
