"use client";

import { useState } from "react";
import { FormularioCliente } from "@/components/formulario-cliente";
import { ListaClientes } from "@/components/lista-clientes";

export function VistaClientes() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [vistaActiva, setVistaActiva] = useState<"alta" | "directorio">("alta");

  return (
    <div className="min-w-0 space-y-16">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-stretch">
        <button
          type="button"
          onClick={() => setVistaActiva("alta")}
          className={`inline-flex min-h-[3rem] w-full items-center justify-center rounded-[10px] border-2 px-8 py-3 text-base font-semibold transition sm:w-auto sm:min-w-[14rem] ${
            vistaActiva === "alta"
              ? "btn-primary border-transparent ring-2 ring-[var(--verde-titulo)] ring-offset-2 ring-offset-white shadow-lg shadow-[rgba(0,166,81,0.25)]"
              : "btn-secondary"
          }`}
        >
          ALTA DE NUEVO CLIENTE
        </button>
        <button
          type="button"
          onClick={() => setVistaActiva("directorio")}
          className={`inline-flex min-h-[3rem] w-full items-center justify-center rounded-[10px] border-2 px-8 py-3 text-base font-semibold transition sm:w-auto sm:min-w-[14rem] ${
            vistaActiva === "directorio"
              ? "btn-primary border-transparent ring-2 ring-[var(--verde-titulo)] ring-offset-2 ring-offset-white shadow-lg shadow-[rgba(0,166,81,0.25)]"
              : "btn-secondary"
          }`}
        >
          DIRECTORIO DE CLIENTES
        </button>
      </div>

      {vistaActiva === "alta" ? (
        <FormularioCliente onClienteCreado={() => setRefreshKey((k) => k + 1)} />
      ) : (
        <div className="rounded-lg bg-white p-6 sm:p-8">
          <ListaClientes refreshKey={refreshKey} />
        </div>
      )}
    </div>
  );
}
