"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import { IconArrowRight } from "@/components/gastos/icons";

const PASOS = [
  { id: "gastos", label: "Gastos", href: "/estudio/gastos", activo: true },
  { id: "cliente", label: "Cliente", href: "/estudio/clientes" },
  { id: "asunto", label: "Asunto", href: "/estudio/asuntos" },
  { id: "presupuesto", label: "Presupuesto", href: "/estudio/presupuestos" },
] as const;

export function FlujoGastosBar({ pasoActivo = "gastos" }: { pasoActivo?: string }) {
  return (
    <nav
      aria-label="Flujo del trámite"
      className="flex flex-wrap items-center gap-1 rounded-xl border border-neutral-200/80 bg-white px-2 py-1.5 shadow-sm"
    >
      {PASOS.map((paso, i) => {
        const activo = paso.id === pasoActivo;
        return (
          <span key={paso.id} className="flex items-center gap-1">
            {i > 0 ? <IconArrowRight className="size-3 text-neutral-300" /> : null}
            <Link
              href={paso.href}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-medium transition",
                activo
                  ? "bg-neutral-900 text-white shadow-sm"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
              )}
            >
              {paso.label}
            </Link>
          </span>
        );
      })}
    </nav>
  );
}
