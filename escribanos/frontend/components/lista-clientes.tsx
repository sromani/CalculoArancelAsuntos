"use client";

import { useCallback, useEffect, useState } from "react";
import {
  etiquetaEstadoCivil,
  etiquetaTipoDocumentoCliente,
  etiquetaTipoPersonaCliente,
} from "@/lib/validaciones";

type ClienteRow = {
  id: string;
  nombre: string;
  documento: string;
  tipoDocumento: string;
  tipoPersona: string;
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

export function ListaClientes({ refreshKey = 0 }: { refreshKey?: number }) {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [lista, setLista] = useState<ClienteRow[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 350);
    return () => clearTimeout(t);
  }, [q]);

  const cargar = useCallback(async () => {
    setCargando(true);
    setMensaje("");
    try {
      const url = debounced ? `/api/clientes?q=${encodeURIComponent(debounced)}` : "/api/clientes";
      const response = await fetch(url);
      const data = await response.json();
      if (!response.ok) {
        setMensaje(data?.error ?? "No se pudo cargar clientes.");
        return;
      }
      setLista(data as ClienteRow[]);
    } catch {
      setMensaje("Error de conexion.");
    } finally {
      setCargando(false);
    }
  }, [debounced]);

  useEffect(() => {
    void cargar().catch(() => setCargando(false));
  }, [cargar, refreshKey]);

  return (
    <div className="min-w-0 space-y-10">
      <div>
        <h2 className="text-xs font-medium uppercase tracking-wide text-neutral-400">Directorio</h2>
        <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <label className="min-w-0 flex-1 sm:max-w-md">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-neutral-500">Buscar</span>
            <input
              className="input-app"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Nombre, documento, contacto…"
            />
          </label>
          {!cargando ? (
            <p className="text-sm text-neutral-500">
              <span className="tabular-nums text-[var(--verde-titulo)]">{lista.length}</span>{" "}
              {lista.length === 1 ? "persona" : "personas"}
            </p>
          ) : null}
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
        <p className="rounded-lg bg-neutral-50/50 px-6 py-10 text-center text-sm text-neutral-600">
          Sin resultados.
        </p>
      ) : (
        <>
          <div className="hidden min-w-0 overflow-hidden rounded-lg bg-white md:block">
            <div className="overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
              <table className="w-full min-w-[920px] text-left text-sm text-neutral-800">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50/80">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                      Apellidos y nombres
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">Documento</th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                      Nac.
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">Estado civil</th>
                    <th className="min-w-[10rem] px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                      Domicilio
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">Persona</th>
                    <th className="max-w-[200px] px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                      Contacto
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {lista.map((c) => (
                    <tr key={c.id} className="transition-colors hover:bg-[rgba(0,166,81,0.04)]">
                      <td className="max-w-[14rem] px-4 py-3 font-medium text-neutral-900">{c.nombre}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-neutral-600">
                        <span className="text-[var(--verde-principal)]">{etiquetaTipoDocumentoCliente(c.tipoDocumento)}</span>{" "}
                        {c.documento}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 tabular-nums text-neutral-600">
                        {c.tipoPersona === "FISICA" ? fmtFechaNac(c.fechaNacimiento) : "—"}
                      </td>
                      <td className="max-w-[9rem] px-4 py-3 text-neutral-600">
                        {c.tipoPersona === "FISICA" ? etiquetaEstadoCivil(c.estadoCivil) : "—"}
                      </td>
                      <td className="max-w-[14rem] px-4 py-3 text-neutral-600" title={c.domicilio ?? undefined}>
                        {c.domicilio?.trim() || "—"}
                      </td>
                      <td className="px-4 py-3 text-neutral-600">{etiquetaTipoPersonaCliente(c.tipoPersona)}</td>
                      <td className="max-w-[240px] px-4 py-3 text-neutral-600">
                        {[c.telefono, c.email, c.contacto].filter(Boolean).join(" · ") || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <ul className="divide-y divide-neutral-200 md:hidden">
            {lista.map((c) => (
              <li key={c.id} className="py-6 first:pt-0">
                <p className="font-medium text-neutral-900">{c.nombre}</p>
                <p className="mt-1 text-sm text-neutral-600">
                  <span className="text-[var(--verde-principal)]">{etiquetaTipoDocumentoCliente(c.tipoDocumento)}</span> {c.documento}
                </p>
                <p className="mt-1 text-xs text-neutral-500">{etiquetaTipoPersonaCliente(c.tipoPersona)}</p>
                {c.tipoPersona === "FISICA" ? (
                  <p className="mt-2 text-sm text-neutral-600">
                    {fmtFechaNac(c.fechaNacimiento)} · {etiquetaEstadoCivil(c.estadoCivil)}
                  </p>
                ) : null}
                <p className="mt-2 text-sm text-neutral-600">{c.domicilio?.trim() || "—"}</p>
                <p className="mt-1 text-sm text-neutral-500">
                  {[c.telefono, c.email, c.contacto].filter(Boolean).join(" · ") || "—"}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
