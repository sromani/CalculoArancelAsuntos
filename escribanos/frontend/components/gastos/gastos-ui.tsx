"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { estudioTw } from "@/lib/estudio-tw";
import { IconX } from "@/components/gastos/icons";

export function GastoBadge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "amber" | "emerald" | "rose" | "sky";
}) {
  const tones = {
    neutral: "bg-neutral-100 text-neutral-700 ring-neutral-200/80",
    amber: "bg-amber-50 text-amber-800 ring-amber-200/70",
    emerald: "bg-emerald-50 text-emerald-800 ring-emerald-200/70",
    rose: "bg-rose-50 text-rose-800 ring-rose-200/70",
    sky: "bg-sky-50 text-sky-800 ring-sky-200/70",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
        tones[tone]
      )}
    >
      {children}
    </span>
  );
}

export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-neutral-200/90 bg-neutral-50/40 p-4 sm:p-5">
      <div className="mb-4 border-b border-neutral-200/80 pb-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">{title}</h3>
        {description ? <p className="mt-1 text-xs text-neutral-500">{description}</p> : null}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export function FieldLabel({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-xs font-medium text-neutral-600">
      {children}
    </label>
  );
}

export const fieldInput = estudioTw.inputSm;

export function ModalShell({
  abierto,
  titulo,
  subtitulo,
  onCerrar,
  children,
  footer,
  ancho = "lg",
}: {
  abierto: boolean;
  titulo: string;
  subtitulo?: string;
  onCerrar: () => void;
  children: ReactNode;
  footer?: ReactNode;
  ancho?: "md" | "lg" | "xl";
}) {
  if (!abierto) return null;

  const anchoClass = {
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-3xl",
  }[ancho];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-neutral-900/40 backdrop-blur-[2px]"
        aria-label="Cerrar"
        onClick={onCerrar}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="gasto-modal-title"
        className={cn(
          "relative flex max-h-[92vh] w-full flex-col overflow-hidden bg-white shadow-2xl",
          "rounded-t-2xl sm:rounded-2xl",
          anchoClass
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-neutral-100 px-5 py-4 sm:px-6">
          <div>
            <h2 id="gasto-modal-title" className="text-lg font-semibold tracking-tight text-neutral-900">
              {titulo}
            </h2>
            {subtitulo ? <p className="mt-0.5 text-sm text-neutral-500">{subtitulo}</p> : null}
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-lg p-2 text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-800"
            aria-label="Cerrar modal"
          >
            <IconX className="size-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">{children}</div>
        {footer ? (
          <div className="shrink-0 border-t border-neutral-100 bg-neutral-50/80 px-5 py-4 sm:px-6">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}

export function KpiMini({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "amber" | "rose" | "emerald";
}) {
  const border = {
    neutral: "border-neutral-200/90",
    amber: "border-amber-200/80 bg-amber-50/30",
    rose: "border-rose-200/80 bg-rose-50/40",
    emerald: "border-emerald-200/80 bg-emerald-50/30",
  }[tone];

  return (
    <div className={cn("rounded-xl border bg-white px-4 py-3 shadow-sm", border)}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums tracking-tight text-neutral-900">{value}</p>
      {hint ? <p className="mt-0.5 text-[11px] text-neutral-500">{hint}</p> : null}
    </div>
  );
}
