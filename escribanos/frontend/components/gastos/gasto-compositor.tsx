"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { estudioTw } from "@/lib/estudio-tw";
import { FlujoGastosBar } from "@/components/gastos/flujo-gastos-bar";
import { FieldLabel, FormSection, fieldInput, GastoBadge } from "@/components/gastos/gastos-ui";
import { IconPlus, IconX } from "@/components/gastos/icons";
import type { GastoCatalogoRow, GastoInput } from "@/lib/gastos/types";
import {
  ETIQUETA_CATEGORIA,
  ETIQUETA_ESTADO_GASTO,
  ETIQUETA_MONEDA,
  ESTADOS_GASTO,
} from "@/lib/gastos/types";
import type { CategoriaGasto, EstadoGasto, MonedaGasto } from "@prisma/client";

export type LineaGastoBorrador = {
  key: string;
  catalogoItemId: string;
  nombre: string;
  categoria: CategoriaGasto;
  oficinaPublica: string;
  descripcion: string;
  importe: string;
  moneda: MonedaGasto;
};

function hoyIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function nuevaKey(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `linea-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function lineaDesdeCatalogo(item: GastoCatalogoRow): LineaGastoBorrador {
  return {
    key: nuevaKey(),
    catalogoItemId: item.id,
    nombre: item.nombre,
    categoria: item.categoria,
    oficinaPublica: item.oficinaPublica ?? "",
    descripcion: item.descripcion ?? "",
    importe: item.importeSugerido != null ? String(item.importeSugerido) : "",
    moneda: item.moneda,
  };
}

function parseImporte(raw: string): number | null {
  const n = Number(raw.replace(/\./g, "").replace(",", ".").trim());
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

function fmtImporte(n: number): string {
  return n.toLocaleString("es-UY", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

type Props = {
  catalogo: GastoCatalogoRow[];
  clientes: { id: string; nombre: string; documento: string }[];
  asuntos: { id: string; ordinal: number; descripcion: string | null; clienteId: string }[];
  initialClienteId?: string;
  initialAsuntoId?: string;
  onGuardarVarios: (inputs: GastoInput[]) => Promise<void>;
};

export function GastoCompositor({
  catalogo,
  clientes,
  asuntos,
  initialClienteId,
  initialAsuntoId,
  onGuardarVarios,
}: Props) {
  const router = useRouter();
  const [lineas, setLineas] = useState<LineaGastoBorrador[]>([]);
  const [fecha, setFecha] = useState(hoyIso());
  const [fechaVencimiento, setFechaVencimiento] = useState("");
  const [estado, setEstado] = useState<EstadoGasto>("PENDIENTE");
  const [observaciones, setObservaciones] = useState("");
  const [clienteId, setClienteId] = useState(initialClienteId ?? "");
  const [asuntoId, setAsuntoId] = useState(initialAsuntoId ?? "");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const idsEnComposicion = useMemo(() => {
    const counts = new Map<string, number>();
    for (const l of lineas) {
      counts.set(l.catalogoItemId, (counts.get(l.catalogoItemId) ?? 0) + 1);
    }
    return counts;
  }, [lineas]);

  const totalesPorMoneda = useMemo(() => {
    const map = new Map<MonedaGasto, number>();
    for (const l of lineas) {
      const imp = parseImporte(l.importe);
      if (imp == null) continue;
      map.set(l.moneda, (map.get(l.moneda) ?? 0) + imp);
    }
    return map;
  }, [lineas]);

  const asuntosFiltrados = clienteId ? asuntos.filter((a) => a.clienteId === clienteId) : asuntos;

  function agregarDelCatalogo(item: GastoCatalogoRow) {
    setLineas((prev) => [...prev, lineaDesdeCatalogo(item)]);
    setError("");
  }

  function quitarLinea(key: string) {
    setLineas((prev) => prev.filter((l) => l.key !== key));
  }

  function actualizarLinea(key: string, patch: Partial<LineaGastoBorrador>) {
    setLineas((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (lineas.length === 0) {
      setError("Agregá al menos un gasto frecuente a la composición.");
      return;
    }

    const inputs: GastoInput[] = [];
    for (const l of lineas) {
      const imp = parseImporte(l.importe);
      if (imp == null) {
        setError(`Revisá el importe de «${l.nombre}».`);
        return;
      }
      inputs.push({
        nombre: l.nombre.trim(),
        categoria: l.categoria,
        oficinaPublica: l.oficinaPublica.trim() || null,
        descripcion: l.descripcion.trim() || null,
        fecha,
        fechaVencimiento: fechaVencimiento || null,
        importe: imp,
        moneda: l.moneda,
        estado,
        observaciones: observaciones.trim() || null,
        catalogoItemId: l.catalogoItemId,
        clienteId: clienteId || null,
        asuntoId: asuntoId || null,
      });
    }

    setGuardando(true);
    try {
      await onGuardarVarios(inputs);
      router.push("/estudio/gastos");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setGuardando(false);
    }
  }

  const presupuestoHref =
    clienteId
      ? `/estudio/presupuestos/nuevo?clienteId=${clienteId}${asuntoId ? `&asuntoId=${asuntoId}` : ""}`
      : null;

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-5xl flex-col text-left">
      <header className="shrink-0 space-y-4 pb-6">
        <Link href="/estudio/gastos" className={estudioTw.linkBack}>
          ← Volver a gastos
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Nuevo gasto</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Elegí gastos frecuentes, armá la lista y registrá todos juntos con el total calculado.
          </p>
        </div>
        <FlujoGastosBar pasoActivo="gastos" />
      </header>

      <form id="gasto-compositor" onSubmit={(e) => void handleSubmit(e)} className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 space-y-4 pb-24">
          {catalogo.length > 0 ? (
            <section className="rounded-xl border border-dashed border-emerald-200/80 bg-emerald-50/25 p-4 sm:p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800">
                Gastos frecuentes
              </p>
              <p className="mt-1 text-xs text-emerald-900/70">
                Tocá cada concepto para sumarlo a la composición. Podés quitarlo después desde la lista.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {catalogo.map((item) => {
                  const veces = idsEnComposicion.get(item.id) ?? 0;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => agregarDelCatalogo(item)}
                      className={cn(
                        "group flex max-w-[220px] flex-col rounded-xl border px-3 py-2.5 text-left text-xs transition",
                        veces > 0
                          ? "border-emerald-400/70 bg-white text-neutral-800 shadow-sm ring-1 ring-emerald-100"
                          : "border-neutral-200 bg-white text-neutral-700 shadow-sm hover:border-emerald-400 hover:shadow-md"
                      )}
                    >
                      <span className="flex items-start justify-between gap-2">
                        <span className="font-medium leading-snug">{item.nombre}</span>
                        <IconPlus className="size-4 shrink-0 text-emerald-600 opacity-70 group-hover:opacity-100" />
                      </span>
                      <span className="mt-1 flex flex-wrap items-center gap-1.5">
                        <GastoBadge tone="neutral">{ETIQUETA_CATEGORIA[item.categoria]}</GastoBadge>
                        {veces > 0 ? (
                          <GastoBadge tone="emerald">×{veces} en lista</GastoBadge>
                        ) : null}
                        {item.importeSugerido != null ? (
                          <span className="tabular-nums text-neutral-500">
                            {ETIQUETA_MONEDA[item.moneda]} {fmtImporte(item.importeSugerido)}
                          </span>
                        ) : (
                          <span className="text-neutral-400">Sin monto sugerido</span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ) : null}

          <section className="rounded-xl border border-neutral-200/90 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-neutral-100 pb-3">
              <div>
                <h2 className="text-sm font-semibold text-neutral-900">Composición del gasto</h2>
                <p className="mt-0.5 text-xs text-neutral-500">
                  {lineas.length === 0
                    ? "Todavía no agregaste conceptos."
                    : `${lineas.length} concepto${lineas.length === 1 ? "" : "s"} en el trámite`}
                </p>
              </div>
              {lineas.length > 0 ? (
                <button
                  type="button"
                  className="text-xs font-medium text-neutral-500 underline-offset-2 hover:text-rose-700 hover:underline"
                  onClick={() => setLineas([])}
                >
                  Vaciar lista
                </button>
              ) : null}
            </div>

            {lineas.length === 0 ? (
              <div className="flex min-h-[140px] flex-col items-center justify-center rounded-lg border border-dashed border-neutral-200 bg-neutral-50/80 px-4 py-8 text-center">
                <p className="text-sm font-medium text-neutral-600">Sin gastos en la lista</p>
                <p className="mt-1 max-w-sm text-xs text-neutral-500">
                  Elegí arriba conceptos como «Inscripción Registro de Propiedad» para armar el gasto del trámite.
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {lineas.map((l, index) => (
                  <li
                    key={l.key}
                    className="flex flex-col gap-3 rounded-xl border border-neutral-200/90 bg-neutral-50/50 p-3 sm:flex-row sm:items-center sm:gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-neutral-900">{l.nombre}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-neutral-500">
                        <GastoBadge tone="sky">{ETIQUETA_CATEGORIA[l.categoria]}</GastoBadge>
                        {l.oficinaPublica ? <span>{l.oficinaPublica}</span> : null}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 sm:w-52">
                      <div className="min-w-0 flex-1">
                        <FieldLabel htmlFor={`imp-${l.key}`}>Importe</FieldLabel>
                        <input
                          id={`imp-${l.key}`}
                          className={cn(fieldInput, "tabular-nums")}
                          value={l.importe}
                          onChange={(e) => actualizarLinea(l.key, { importe: e.target.value })}
                          inputMode="decimal"
                          placeholder="0"
                          aria-label={`Importe ${l.nombre}`}
                        />
                      </div>
                      <span className="mt-5 shrink-0 text-xs font-medium text-neutral-600">
                        {ETIQUETA_MONEDA[l.moneda]}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => quitarLinea(l.key)}
                      className="self-start rounded-lg p-2 text-neutral-400 transition hover:bg-rose-50 hover:text-rose-700 sm:mt-1 sm:self-center"
                      aria-label={`Quitar ${l.nombre}`}
                      title="Quitar de la lista"
                    >
                      <IconX className="size-5" />
                    </button>
                    <span className="sr-only">Ítem {index + 1}</span>
                  </li>
                ))}
              </ul>
            )}

            {lineas.length > 0 ? (
              <div className="mt-4 rounded-xl border border-emerald-200/80 bg-emerald-50/40 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800">Total</p>
                <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1">
                  {totalesPorMoneda.size === 0 ? (
                    <p className="text-sm text-neutral-500">Completá los importes para ver el total.</p>
                  ) : (
                    [...totalesPorMoneda.entries()].map(([moneda, total]) => (
                      <p key={moneda} className="text-lg font-semibold tabular-nums text-emerald-900">
                        {ETIQUETA_MONEDA[moneda]}{" "}
                        <span>{fmtImporte(total)}</span>
                      </p>
                    ))
                  )}
                </div>
                {totalesPorMoneda.size > 1 ? (
                  <p className="mt-2 text-[11px] text-emerald-900/70">
                    Hay conceptos en distintas monedas; el total se muestra separado por cada una.
                  </p>
                ) : null}
              </div>
            ) : null}
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <FormSection title="Fechas">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <FieldLabel htmlFor="gc-fecha">Fecha del gasto</FieldLabel>
                  <input
                    id="gc-fecha"
                    type="date"
                    className={fieldInput}
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="gc-venc">Vencimiento</FieldLabel>
                  <input
                    id="gc-venc"
                    type="date"
                    className={fieldInput}
                    value={fechaVencimiento}
                    onChange={(e) => setFechaVencimiento(e.target.value)}
                  />
                </div>
              </div>
            </FormSection>

            <FormSection
              title="Relación"
              description="Cliente y asunto comunes para todos los conceptos de esta composición."
            >
              <div>
                <FieldLabel htmlFor="gc-cliente">Cliente</FieldLabel>
                <select
                  id="gc-cliente"
                  className={fieldInput}
                  value={clienteId}
                  onChange={(e) => {
                    setClienteId(e.target.value);
                    setAsuntoId("");
                  }}
                >
                  <option value="">Sin vincular</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel htmlFor="gc-asunto">Asunto</FieldLabel>
                <select
                  id="gc-asunto"
                  className={fieldInput}
                  value={asuntoId}
                  onChange={(e) => setAsuntoId(e.target.value)}
                  disabled={!clienteId}
                >
                  <option value="">Sin asunto</option>
                  {asuntosFiltrados.map((a) => (
                    <option key={a.id} value={a.id}>
                      #{a.ordinal} {a.descripcion ?? "Sin descripción"}
                    </option>
                  ))}
                </select>
              </div>
              {presupuestoHref ? (
                <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2.5">
                  <p className="text-xs font-medium text-neutral-700">Presupuesto al cliente</p>
                  <Link
                    href={presupuestoHref}
                    className="mt-2 inline-flex text-xs font-semibold text-emerald-700 hover:underline"
                  >
                    Ir a nuevo presupuesto →
                  </Link>
                </div>
              ) : null}
            </FormSection>

            <FormSection title="Estado">
              <div className="flex flex-wrap gap-2">
                {ESTADOS_GASTO.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setEstado(s)}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-xs font-medium transition",
                      estado === s
                        ? "border-neutral-900 bg-neutral-900 text-white shadow-sm"
                        : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300"
                    )}
                  >
                    {ETIQUETA_ESTADO_GASTO[s]}
                  </button>
                ))}
              </div>
            </FormSection>

            <FormSection title="Observaciones">
              <textarea
                id="gc-obs"
                className={cn(fieldInput, "min-h-[72px] resize-y")}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Notas internas para todos los gastos de esta composición (opcional)"
              />
            </FormSection>
          </div>

          {error ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>
          ) : null}
        </div>

        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200/90 bg-white/95 px-4 py-4 backdrop-blur-sm sm:static sm:mt-auto sm:border-t sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
          <div className="mx-auto flex max-w-5xl flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            {lineas.length > 0 && totalesPorMoneda.size > 0 ? (
              <p className="text-center text-sm text-neutral-600 sm:text-left">
                <span className="font-medium text-neutral-900">{lineas.length} gastos</span>
                {" · "}
                {[...totalesPorMoneda.entries()]
                  .map(([m, t]) => `${ETIQUETA_MONEDA[m]} ${fmtImporte(t)}`)
                  .join(" + ")}
              </p>
            ) : (
              <span className="hidden sm:block" />
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Link href="/estudio/gastos" className={cn(estudioTw.btnSecondary, "text-center")}>
                Cancelar
              </Link>
              <button
                type="submit"
                className={estudioTw.btnPrimary}
                disabled={guardando || lineas.length === 0}
              >
                {guardando
                  ? "Guardando…"
                  : lineas.length <= 1
                    ? "Registrar gasto"
                    : `Registrar ${lineas.length} gastos`}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
