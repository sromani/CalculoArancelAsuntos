"use client";

import { cn } from "@/lib/cn";
import { estudioTw } from "@/lib/estudio-tw";
import {
  CATEGORIAS_GASTO,
  ESTADOS_GASTO,
  ETIQUETA_CATEGORIA,
  ETIQUETA_ESTADO_GASTO,
  type GastosFiltros,
} from "@/lib/gastos/types";
import { IconSearch } from "@/components/gastos/icons";
import type { EstadoGasto } from "@prisma/client";

type Props = {
  filtros: GastosFiltros;
  setFiltros: React.Dispatch<React.SetStateAction<GastosFiltros>>;
  clientes: { id: string; nombre: string }[];
  total: number;
  hayFiltros: boolean;
};

export function GastosFiltrosBar({ filtros, setFiltros, clientes, total, hayFiltros }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="search"
            placeholder="Buscar por nombre, oficina, cliente…"
            className={cn(estudioTw.input, "pl-9")}
            value={filtros.q ?? ""}
            onChange={(e) => setFiltros((f) => ({ ...f, q: e.target.value, page: 1 }))}
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <select
            className={estudioTw.inputSm}
            value={filtros.estado ?? ""}
            onChange={(e) =>
              setFiltros((f) => ({ ...f, estado: e.target.value as EstadoGasto | "", page: 1 }))
            }
          >
            <option value="">Estado</option>
            {ESTADOS_GASTO.map((s) => (
              <option key={s} value={s}>{ETIQUETA_ESTADO_GASTO[s]}</option>
            ))}
          </select>
          <select
            className={estudioTw.inputSm}
            value={filtros.categoria ?? ""}
            onChange={(e) =>
              setFiltros((f) => ({
                ...f,
                categoria: e.target.value as GastosFiltros["categoria"],
                page: 1,
              }))
            }
          >
            <option value="">Categoría</option>
            {CATEGORIAS_GASTO.map((c) => (
              <option key={c} value={c}>{ETIQUETA_CATEGORIA[c]}</option>
            ))}
          </select>
          <select
            className={cn(estudioTw.inputSm, "col-span-2 sm:col-span-1 sm:min-w-[160px]")}
            value={filtros.clienteId ?? ""}
            onChange={(e) =>
              setFiltros((f) => ({ ...f, clienteId: e.target.value || undefined, page: 1 }))
            }
          >
            <option value="">Cliente</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-500">
        <span>{total} gasto{total === 1 ? "" : "s"}</span>
        {hayFiltros ? (
          <button
            type="button"
            className="font-medium text-emerald-700 hover:underline"
            onClick={() => setFiltros({ page: 1, pageSize: filtros.pageSize ?? 20 })}
          >
            Limpiar filtros
          </button>
        ) : null}
      </div>
    </div>
  );
}
