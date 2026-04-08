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
    <div className="w-full min-w-0">
      <div
        className={cn(
          "overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-[0_12px_40px_-18px_rgba(15,23,42,0.18)]",
        )}
      >
        <div className={cn("border-b border-gray-100 bg-white py-4 sm:py-5", estudioTw.cardPadX)}>
          <div className={estudioTw.busquedaFieldOuter}>
            <div className={estudioTw.busquedaFieldShell}>
              <span className={estudioTw.busquedaIconWrap} aria-hidden>
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.2-5.2M10 18a8 8 0 110-16 8 8 0 010 16z" />
                </svg>
              </span>
              <input
                id="busqueda-clientes"
                type="search"
                aria-label="Buscar clientes"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Ej. García, 4.567.890-1, 099…"
                autoComplete="off"
                className={estudioTw.busquedaFieldInput}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-gray-500">
            {cargando ? (
              <span className="inline-flex items-center gap-2">
                <span
                  className="size-3.5 animate-spin rounded-full border-2 border-gray-200 border-t-emerald-600"
                  aria-hidden
                />
                Actualizando…
              </span>
            ) : busquedaActiva ? (
              <span>
                <span className="font-semibold tabular-nums text-gray-800">{lista.length}</span>
                {lista.length === 1 ? " resultado" : " resultados"} para la búsqueda
              </span>
            ) : (
              <span>
                <span className="font-semibold tabular-nums text-gray-800">{lista.length}</span>
                {lista.length === 1 ? " cliente" : " clientes"}
                {lista.length >= 500 ? " (máx. mostrados)" : ""}
              </span>
            )}
          </div>
        </div>

        <div className="mt-6 border-t border-gray-200 bg-gray-50/50 pt-4 sm:mt-8 sm:pt-5">
          {lista.length > 0 ? (
            <>
              <div className="hidden md:block">
                <div className="overflow-x-auto px-4 pb-4 pt-2 sm:px-6">
                  <table className="w-full min-w-[1020px] text-left text-sm text-gray-700">
                    <caption className="sr-only">Clientes del estudio</caption>
                    <thead>
                      <tr className="border-b border-gray-200 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        <th className="sticky left-0 z-20 w-[4rem] min-w-[4rem] border-r border-gray-200 bg-gray-50 px-2 py-3 text-left text-emerald-800 shadow-[4px_0_12px_-6px_rgba(15,23,42,0.06)]">
                          Editar
                        </th>
                        <th className="px-3 py-3">Cliente</th>
                        <th className="px-3 py-3">Tipo doc.</th>
                        <th className="px-3 py-3">Número</th>
                        <th className="px-3 py-3">Domicilio</th>
                        <th className="px-3 py-3">Persona</th>
                        <th className="px-3 py-3">Tipo social</th>
                        <th className="px-3 py-3">Nacimiento</th>
                        <th className="px-3 py-3">Estado civil</th>
                        <th className="px-3 py-3">Teléfono</th>
                        <th className="px-3 py-3">Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lista.map((c, i) => (
                        <tr
                          key={c.id}
                          className={cn(
                            "border-b border-gray-100 transition-colors hover:bg-emerald-50/40",
                            i % 2 === 1 ? "bg-gray-50/70" : "bg-white",
                          )}
                        >
                          <td
                            className={cn(
                              "sticky left-0 z-10 border-r border-gray-100 px-2 py-3 align-middle shadow-[4px_0_12px_-6px_rgba(15,23,42,0.05)]",
                              i % 2 === 1 ? "bg-gray-50/95" : "bg-white",
                            )}
                          >
                            <Link
                              href={`/estudio/clientes/${c.id}/editar`}
                              className={cn(linkEditarCliente, "inline-block text-xs sm:text-sm")}
                            >
                              Editar
                            </Link>
                          </td>
                          <td className="px-3 py-3">
                            <p className="min-w-0 font-medium text-gray-900">{c.nombre}</p>
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-xs font-medium text-emerald-700">
                            {etiquetaTipoDocumentoCliente(c.tipoDocumento)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 tabular-nums text-gray-800">{c.documento}</td>
                          <td className="max-w-[11rem] px-3 py-3 text-xs text-gray-600" title={c.domicilio?.trim() || undefined}>
                            {c.domicilio?.trim() || "—"}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-xs text-gray-800">
                            {etiquetaTipoPersonaCliente(c.tipoPersona)}
                          </td>
                          <td className="max-w-[8rem] truncate px-3 py-3 text-xs text-gray-600" title={c.tipoSocial ? etiquetaTipoSocial(c.tipoSocial) : undefined}>
                            {c.tipoPersona === "JURIDICA" && c.tipoSocial ? etiquetaTipoSocial(c.tipoSocial) : "—"}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-xs tabular-nums text-gray-600">
                            {c.tipoPersona === "FISICA" ? fmtFechaNac(c.fechaNacimiento) : "—"}
                          </td>
                          <td className="max-w-[7rem] truncate px-3 py-3 text-xs text-gray-600" title={c.tipoPersona === "FISICA" ? etiquetaEstadoCivil(c.estadoCivil) : undefined}>
                            {c.tipoPersona === "FISICA" ? etiquetaEstadoCivil(c.estadoCivil) : "—"}
                          </td>
                          <td className="max-w-[7rem] truncate px-3 py-3 text-xs text-gray-600" title={c.telefono ?? undefined}>
                            {c.telefono?.trim() || "—"}
                          </td>
                          <td className="max-w-[9rem] truncate px-3 py-3 text-xs text-gray-600" title={c.email ?? undefined}>
                            {c.email?.trim() || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <ul className="flex flex-col gap-4 p-4 md:hidden sm:p-5">
                {lista.map((c) => (
                  <li
                    key={c.id}
                    className="rounded-2xl border border-gray-200/90 bg-white p-4 shadow-sm ring-1 ring-black/[0.02]"
                  >
                    <div className="flex gap-3">
                      <Link
                        href={`/estudio/clientes/${c.id}/editar`}
                        className={cn(linkEditarCliente, "shrink-0 self-start pt-0.5 text-sm")}
                      >
                        Editar
                      </Link>
                      <dl className="min-w-0 flex-1 grid grid-cols-1 gap-x-3 gap-y-2 text-xs sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <dt className="font-semibold text-gray-500">Nombre</dt>
                          <dd className="mt-0.5 text-sm font-semibold text-gray-900">{c.nombre}</dd>
                        </div>
                        <div>
                          <dt className="font-semibold text-gray-500">Tipo doc.</dt>
                          <dd className="mt-0.5 text-emerald-800">{etiquetaTipoDocumentoCliente(c.tipoDocumento)}</dd>
                        </div>
                        <div>
                          <dt className="font-semibold text-gray-500">Número</dt>
                          <dd className="mt-0.5 tabular-nums text-gray-800">{c.documento}</dd>
                        </div>
                        <div className="sm:col-span-2">
                          <dt className="font-semibold text-gray-500">Domicilio</dt>
                          <dd className="mt-0.5 text-gray-700">{c.domicilio?.trim() || "—"}</dd>
                        </div>
                        <div>
                          <dt className="font-semibold text-gray-500">Persona</dt>
                          <dd className="mt-0.5 text-gray-800">{etiquetaTipoPersonaCliente(c.tipoPersona)}</dd>
                        </div>
                        <div>
                          <dt className="font-semibold text-gray-500">Tipo social</dt>
                          <dd className="mt-0.5 text-gray-700">
                            {c.tipoPersona === "JURIDICA" && c.tipoSocial ? etiquetaTipoSocial(c.tipoSocial) : "—"}
                          </dd>
                        </div>
                        <div>
                          <dt className="font-semibold text-gray-500">Nacimiento</dt>
                          <dd className="mt-0.5 tabular-nums text-gray-700">
                            {c.tipoPersona === "FISICA" ? fmtFechaNac(c.fechaNacimiento) : "—"}
                          </dd>
                        </div>
                        <div>
                          <dt className="font-semibold text-gray-500">Estado civil</dt>
                          <dd className="mt-0.5 text-gray-700">
                            {c.tipoPersona === "FISICA" ? etiquetaEstadoCivil(c.estadoCivil) : "—"}
                          </dd>
                        </div>
                        <div>
                          <dt className="font-semibold text-gray-500">Teléfono</dt>
                          <dd className="mt-0.5 text-gray-700">{c.telefono?.trim() || "—"}</dd>
                        </div>
                        <div className="sm:col-span-2">
                          <dt className="font-semibold text-gray-500">Email</dt>
                          <dd className="mt-0.5 break-all text-gray-700">{c.email?.trim() || "—"}</dd>
                        </div>
                      </dl>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          ) : !cargando ? (
            <div className="bg-white px-6 py-14 text-center sm:px-8 sm:py-16">
              <p className="text-base font-bold text-gray-900">Sin resultados</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-gray-600">
                {busquedaActiva
                  ? "Probá con otra palabra, parte del documento o del teléfono."
                  : "Creá un cliente con Nuevo cliente (arriba a la derecha)."}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {mensaje ? (
        <div
          className="mt-4 rounded-xl border border-amber-200/90 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          role="alert"
        >
          {mensaje}
        </div>
      ) : null}
    </div>
  );
}
