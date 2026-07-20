"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { estudioTw } from "@/lib/estudio-tw";
import { exportarGastosExcel, exportarGastosPdf } from "@/lib/gastos/export";
import type { GastoRow } from "@/lib/gastos/types";
import { FlujoGastosBar } from "@/components/gastos/flujo-gastos-bar";
import { GastosDashboard } from "@/components/gastos/gastos-dashboard";
import { GastosEmptyState } from "@/components/gastos/gastos-empty-state";
import { GastosFiltrosBar } from "@/components/gastos/gastos-filtros";
import { GastosTabla, GastosTablaSkeleton } from "@/components/gastos/gastos-tabla";
import { GastosToastProvider, useGastosToast } from "@/components/gastos/gastos-toast";
import { IconFile, IconPlus } from "@/components/gastos/icons";
import { ModalShell } from "@/components/gastos/gastos-ui";
import { useGastos } from "@/components/gastos/use-gastos";

function nuevoGastoHref(initial?: { clienteId?: string; asuntoId?: string }) {
  const p = new URLSearchParams();
  if (initial?.clienteId) p.set("clienteId", initial.clienteId);
  if (initial?.asuntoId) p.set("asuntoId", initial.asuntoId);
  const qs = p.toString();
  return qs ? `/estudio/gastos/nuevo?${qs}` : "/estudio/gastos/nuevo";
}

function PanelGastosInner({ initialFiltros }: { initialFiltros?: { asuntoId?: string; clienteId?: string } }) {
  const { toast } = useGastosToast();
  const {
    filtros,
    setFiltros,
    lista,
    paginacion,
    resumen,
    cargando,
    error,
    clientes,
    puedeEditar,
    recargar,
    eliminar,
  } = useGastos(initialFiltros ?? {});

  const [eliminarTarget, setEliminarTarget] = useState<GastoRow | null>(null);

  const hayFiltros = Boolean(
    filtros.q?.trim() ||
      filtros.fechaDesde ||
      filtros.fechaHasta ||
      filtros.clienteId ||
      filtros.asuntoId ||
      filtros.categoria ||
      filtros.estado
  );

  const hrefNuevo = nuevoGastoHref(initialFiltros);

  return (
    <div className={cn("mx-auto w-full min-w-0 max-w-7xl text-left", estudioTw.stack)}>
      <header className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Gastos</h1>
            <p className="mt-1 max-w-xl text-sm text-neutral-500">
              Gastos del trámite vinculados a clientes y asuntos. Después se incluyen en el presupuesto al cliente.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {puedeEditar ? (
              <Link href={hrefNuevo} className={cn(estudioTw.btnPrimary, "gap-2")}>
                <IconPlus className="size-4" />
                Nuevo gasto
              </Link>
            ) : null}
            <Link href="/estudio/presupuestos/nuevo" className={estudioTw.btnListNuevo}>
              Presupuesto
            </Link>
          </div>
        </div>
        <FlujoGastosBar pasoActivo="gastos" />
      </header>

      <GastosDashboard
        resumen={resumen}
        lista={lista}
        cargando={cargando}
        onFiltrarVencidos={() => setFiltros((f) => ({ ...f, estado: "VENCIDO", page: 1 }))}
        onFiltrarPendientes={() => setFiltros((f) => ({ ...f, estado: "PENDIENTE", page: 1 }))}
      />

      <section className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm">
        <div className="border-b border-neutral-100 px-4 py-4 sm:px-5">
          <GastosFiltrosBar
            filtros={filtros}
            setFiltros={setFiltros}
            clientes={clientes}
            total={paginacion.total}
            hayFiltros={hayFiltros}
          />
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-b border-neutral-50 px-4 py-2 sm:px-5">
          <button
            type="button"
            className={estudioTw.btnGhost}
            disabled={lista.length === 0}
            onClick={() => void exportarGastosExcel(lista)}
          >
            <IconFile className="mr-1.5 inline size-3.5" />
            Excel
          </button>
          <button
            type="button"
            className={estudioTw.btnGhost}
            disabled={lista.length === 0}
            onClick={() => exportarGastosPdf(lista)}
          >
            PDF
          </button>
        </div>

        <div className="p-4 sm:p-5">
          {error ? (
            <p className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              {error}
            </p>
          ) : null}

          {cargando && lista.length === 0 ? (
            <GastosTablaSkeleton />
          ) : lista.length === 0 ? (
            <GastosEmptyState hrefNuevo={hrefNuevo} puedeEditar={puedeEditar} />
          ) : (
            <>
              <GastosTabla
                lista={lista}
                puedeEditar={puedeEditar}
                onEliminar={setEliminarTarget}
              />
              {paginacion.totalPages > 1 ? (
                <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-4 text-sm">
                  <span className="text-neutral-500">
                    Página {paginacion.page} de {paginacion.totalPages}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className={estudioTw.btnSecondarySm}
                      disabled={paginacion.page <= 1}
                      onClick={() => setFiltros((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}
                    >
                      Anterior
                    </button>
                    <button
                      type="button"
                      className={estudioTw.btnSecondarySm}
                      disabled={paginacion.page >= paginacion.totalPages}
                      onClick={() => setFiltros((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </section>

      <ModalShell
        abierto={Boolean(eliminarTarget)}
        titulo="Eliminar gasto"
        subtitulo="Esta acción no se puede deshacer."
        onCerrar={() => setEliminarTarget(null)}
        ancho="md"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className={estudioTw.btnSecondary} onClick={() => setEliminarTarget(null)}>
              Cancelar
            </button>
            <button
              type="button"
              className={estudioTw.btnDangerSm}
              onClick={() => {
                void (async () => {
                  if (!eliminarTarget) return;
                  try {
                    await eliminar(eliminarTarget.id);
                    toast("Gasto eliminado.", "ok");
                    setEliminarTarget(null);
                    await recargar();
                  } catch (e) {
                    toast(e instanceof Error ? e.message : "Error", "error");
                  }
                })();
              }}
            >
              Eliminar
            </button>
          </div>
        }
      >
        {eliminarTarget ? (
          <p className="text-sm text-neutral-600">
            ¿Eliminar <strong className="text-neutral-900">{eliminarTarget.nombre}</strong>?
          </p>
        ) : null}
      </ModalShell>
    </div>
  );
}

export function PanelGastos({
  initialFiltros,
}: { initialFiltros?: { asuntoId?: string; clienteId?: string } } = {}) {
  return (
    <GastosToastProvider>
      <PanelGastosInner initialFiltros={initialFiltros} />
    </GastosToastProvider>
  );
}
