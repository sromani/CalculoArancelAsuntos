"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import { estudioTw } from "@/lib/estudio-tw";
import { IconPlus, IconReceipt } from "@/components/gastos/icons";

export function GastosEmptyState({ hrefNuevo, puedeEditar }: { hrefNuevo: string; puedeEditar: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200 bg-neutral-50/50 px-6 py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200/80">
        <IconReceipt className="size-7 text-neutral-400" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-neutral-900">Todavía no hay gastos</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-neutral-500">
        Registrá gastos del trámite (registro, tributos, gestiones) y reutilizalos al armar el presupuesto al
        cliente.
      </p>
      {puedeEditar ? (
        <Link href={hrefNuevo} className={cn(estudioTw.btnPrimary, "mt-6 gap-2")}>
          <IconPlus className="size-4" />
          Registrar primer gasto
        </Link>
      ) : null}
    </div>
  );
}
