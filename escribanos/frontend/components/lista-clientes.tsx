"use client";

import { useCallback, useEffect, useState } from "react";
import { etiquetaTipoDocumentoCliente, etiquetaTipoPersonaCliente } from "@/lib/validaciones";

type ClienteRow = {
  id: string;
  nombre: string;
  documento: string;
  tipoDocumento: string;
  tipoPersona: string;
  telefono: string | null;
  email: string | null;
  contacto: string | null;
};

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

  async function eliminar(id: string, nombre: string) {
    if (!window.confirm(`Eliminar cliente "${nombre}"? Solo si no tiene asuntos asociados.`)) {
      return;
    }
    setMensaje("");
    try {
      const response = await fetch(`/api/clientes/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) {
        setMensaje(data?.error ?? "No se pudo eliminar.");
        return;
      }
      await cargar();
    } catch {
      setMensaje("Error de conexion.");
    }
  }

  return (
    <div className="card-app min-w-0 space-y-6 rounded-2xl p-5 sm:p-6">
      <div className="flex flex-col gap-4 border-b border-[rgba(0,166,81,0.12)] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-[var(--verde-titulo)] sm:text-xl">Registro de personas</h2>
          <p className="mt-1 text-base leading-relaxed text-[var(--gris-texto)]">
            Búsqueda por nombre, documento o datos de contacto.
          </p>
        </div>
        <label className="w-full min-w-0 flex-1 space-y-1.5 sm:max-w-sm">
          <span className="text-sm font-semibold text-[var(--verde-titulo)]">Buscar</span>
          <input
            className="input-app"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nombre, documento, teléfono, email…"
          />
        </label>
      </div>

      {mensaje ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">{mensaje}</p>
      ) : null}

      {cargando ? (
        <p className="text-base text-[var(--gris-texto)]">Cargando...</p>
      ) : lista.length === 0 ? (
        <p className="text-base text-[var(--gris-texto)]">Sin resultados.</p>
      ) : (
        <>
          <div className="hidden min-w-0 md:block">
            <div className="overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
              <table className="w-full min-w-[720px] text-left text-sm text-[var(--color-neutral-900)]">
                <thead>
                  <tr className="border-b border-[rgba(0,166,81,0.2)] bg-[rgba(0,166,81,0.04)] text-[var(--verde-titulo)]">
                    <th className="px-4 py-3 font-semibold">Nombre</th>
                    <th className="px-4 py-3 font-semibold">Documento</th>
                    <th className="px-4 py-3 font-semibold">Persona</th>
                    <th className="px-4 py-3 font-semibold">Contacto</th>
                    <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {lista.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-[rgba(0,166,81,0.14)] transition-colors hover:bg-[var(--fondo-verde-muy-claro)]/60 last:border-0"
                    >
                      <td className="px-4 py-3 font-medium text-[var(--verde-titulo)]">{c.nombre}</td>
                      <td className="px-4 py-3 text-[var(--gris-texto)]">
                        <span className="text-sm font-medium text-[var(--verde-principal)]">
                          {etiquetaTipoDocumentoCliente(c.tipoDocumento)}
                        </span>{" "}
                        {c.documento}
                      </td>
                      <td className="px-4 py-3 text-[var(--gris-texto)]">
                        {etiquetaTipoPersonaCliente(c.tipoPersona)}
                      </td>
                      <td className="max-w-[240px] px-4 py-3 text-[var(--gris-texto)]">
                        {[c.telefono, c.email, c.contacto].filter(Boolean).join(" · ") || "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          className="inline-flex min-h-[2.5rem] min-w-[5.5rem] items-center justify-center rounded-[10px] border-2 border-red-200 bg-red-50 px-3 text-sm font-semibold text-red-800 transition-colors hover:bg-red-100"
                          onClick={() => void eliminar(c.id, c.nombre)}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <ul className="flex flex-col gap-4 md:hidden">
            {lista.map((c) => (
              <li
                key={c.id}
                className="rounded-xl border border-[rgba(0,166,81,0.28)] bg-white p-4 shadow-sm shadow-[rgba(0,166,81,0.06)] sm:p-5"
              >
                <p className="text-base font-semibold leading-snug text-[var(--verde-titulo)]">{c.nombre}</p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--gris-texto)]">
                  <span className="font-semibold text-[var(--verde-principal)]">
                    {etiquetaTipoDocumentoCliente(c.tipoDocumento)}
                  </span>{" "}
                  {c.documento}
                </p>
                <p className="mt-1 text-sm text-[var(--gris-texto)]">{etiquetaTipoPersonaCliente(c.tipoPersona)}</p>
                <p className="mt-3 break-words text-sm leading-relaxed text-[var(--gris-texto)]">
                  {[c.telefono, c.email, c.contacto].filter(Boolean).join(" · ") || "—"}
                </p>
                <button
                  type="button"
                  className="mt-4 inline-flex min-h-[3rem] w-full items-center justify-center rounded-[10px] border-2 border-red-200 bg-red-50 px-4 text-base font-semibold text-red-800 transition-colors hover:bg-red-100"
                  onClick={() => void eliminar(c.id, c.nombre)}
                >
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
