"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { estudioTw } from "@/lib/estudio-tw";
import { fmtFecha, fmtImporte } from "@/lib/gastos/resumen";
import { ETIQUETA_CATEGORIA, ETIQUETA_ESTADO_GASTO, type GastoRow } from "@/lib/gastos/types";
import { GastoBadge } from "@/components/gastos/gastos-ui";
import { IconDots, IconReceipt } from "@/components/gastos/icons";
import type { EstadoGasto } from "@prisma/client";

function toneEstado(e: EstadoGasto): "amber" | "emerald" | "rose" {
  if (e === "PAGO_REALIZADO") return "emerald";
  if (e === "VENCIDO") return "rose";
  return "amber";
}

function MenuAcciones({
  editHref,
  onEliminar,
  presupuestoHref,
}: {
  editHref: string;
  onEliminar: () => void;
  presupuestoHref: string | null;
}) {
  const [abierto, setAbierto] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        className="rounded-lg p-1.5 text-neutral-500 opacity-0 transition hover:bg-neutral-100 group-hover:opacity-100 data-[open]:opacity-100"
        aria-label="Acciones"
        data-open={abierto || undefined}
        onClick={() => setAbierto((v) => !v)}
      >
        <IconDots className="size-4" />
      </button>
      {abierto ? (
        <>
          <button type="button" className="fixed inset-0 z-10" aria-label="Cerrar menú" onClick={() => setAbierto(false)} />
          <div className="absolute right-0 z-20 mt-1 min-w-[140px] rounded-lg border border-neutral-200 bg-white py-1 shadow-lg">
            <Link
              href={editHref}
              className="block px-3 py-2 text-xs text-neutral-700 hover:bg-neutral-50"
              onClick={() => setAbierto(false)}
            >
              Editar
            </Link>
            {presupuestoHref ? (
              <Link
                href={presupuestoHref}
                className="block px-3 py-2 text-xs text-emerald-700 hover:bg-neutral-50"
                onClick={() => setAbierto(false)}
              >
                En presupuesto
              </Link>
            ) : null}
            <button
              type="button"
              className="block w-full px-3 py-2 text-left text-xs text-rose-700 hover:bg-rose-50"
              onClick={() => {
                setAbierto(false);
                onEliminar();
              }}
            >
              Eliminar
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}

export function GastosTabla({
  lista,
  puedeEditar,
  onEliminar,
}: {
  lista: GastoRow[];
  puedeEditar: boolean;
  onEliminar: (g: GastoRow) => void;
}) {
  return (
    <>
      {/* Desktop */}
      <div className="hidden overflow-hidden rounded-xl border border-neutral-200/90 bg-white shadow-sm md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50/80 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
              <th className="px-4 py-2.5">Gasto</th>
              <th className="px-3 py-2.5">Cliente</th>
              <th className="px-3 py-2.5">Asunto</th>
              <th className="px-3 py-2.5">Categoría</th>
              <th className="px-3 py-2.5">Vencimiento</th>
              <th className="px-3 py-2.5 text-right">Importe</th>
              <th className="px-3 py-2.5">Estado</th>
              {puedeEditar ? <th className="w-10 px-2 py-2.5" /> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {lista.map((g) => {
              const presupuestoHref =
                g.clienteId
                  ? `/estudio/presupuestos/nuevo?clienteId=${g.clienteId}${g.asuntoId ? `&asuntoId=${g.asuntoId}` : ""}`
                  : null;
              return (
                <tr key={g.id} className="group transition hover:bg-neutral-50/80">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
                        <IconReceipt className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-neutral-900">{g.nombre}</p>
                        {g.oficinaPublica ? (
                          <p className="truncate text-xs text-neutral-500">{g.oficinaPublica}</p>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="max-w-[120px] truncate px-3 py-3 text-xs text-neutral-700">
                    {g.cliente?.nombre ?? "—"}
                  </td>
                  <td className="px-3 py-3 text-xs text-neutral-600">
                    {g.asunto ? (
                      <Link href={`/estudio/asuntos/${g.asunto.id}`} className="hover:text-emerald-700 hover:underline">
                        #{g.asunto.ordinal}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <GastoBadge tone="neutral">{ETIQUETA_CATEGORIA[g.categoria]}</GastoBadge>
                  </td>
                  <td className="px-3 py-3 text-xs tabular-nums text-neutral-600">
                    {fmtFecha(g.fechaVencimiento)}
                  </td>
                  <td className="px-3 py-3 text-right text-sm font-semibold tabular-nums text-neutral-900">
                    {fmtImporte(g.importe, g.moneda)}
                  </td>
                  <td className="px-3 py-3">
                    <GastoBadge tone={toneEstado(g.estado)}>{ETIQUETA_ESTADO_GASTO[g.estado]}</GastoBadge>
                  </td>
                  {puedeEditar ? (
                    <td className="px-2 py-3">
                      <MenuAcciones
                        editHref={`/estudio/gastos/${g.id}/editar`}
                        onEliminar={() => onEliminar(g)}
                        presupuestoHref={presupuestoHref}
                      />
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="space-y-2 md:hidden">
        {lista.map((g) => (
          <div
            key={g.id}
            className="rounded-xl border border-neutral-200/90 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-neutral-900">{g.nombre}</p>
                <p className="mt-0.5 text-xs text-neutral-500">
                  {g.cliente?.nombre ?? "Sin cliente"}
                  {g.asunto ? ` · #${g.asunto.ordinal}` : ""}
                </p>
              </div>
              <GastoBadge tone={toneEstado(g.estado)}>{ETIQUETA_ESTADO_GASTO[g.estado]}</GastoBadge>
            </div>
            <div className="mt-3 flex items-end justify-between">
              <div>
                <p className="text-lg font-semibold tabular-nums">{fmtImporte(g.importe, g.moneda)}</p>
                <p className="text-[11px] text-neutral-500">
                  Vence {fmtFecha(g.fechaVencimiento)} · {ETIQUETA_CATEGORIA[g.categoria]}
                </p>
              </div>
              {puedeEditar ? (
                <Link href={`/estudio/gastos/${g.id}/editar`} className={estudioTw.btnSecondarySm}>
                  Editar
                </Link>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export function GastosTablaSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-14 animate-pulse rounded-xl bg-neutral-200/40" />
      ))}
    </div>
  );
}
