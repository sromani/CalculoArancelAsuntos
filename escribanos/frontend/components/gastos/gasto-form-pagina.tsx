"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { estudioTw } from "@/lib/estudio-tw";
import type { GastoInput, GastoRow } from "@/lib/gastos/types";
import {
  CATEGORIAS_GASTO,
  ESTADOS_GASTO,
  ETIQUETA_CATEGORIA,
  ETIQUETA_ESTADO_GASTO,
  ETIQUETA_MONEDA,
} from "@/lib/gastos/types";
import { FlujoGastosBar } from "@/components/gastos/flujo-gastos-bar";
import { FieldLabel, FormSection, fieldInput } from "@/components/gastos/gastos-ui";
import type { CategoriaGasto, EstadoGasto, MonedaGasto } from "@prisma/client";

const MONEDAS: MonedaGasto[] = ["PESOS", "DOLARES", "UR", "UI"];

function hoyIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

type Props = {
  gasto?: GastoRow | null;
  clientes: { id: string; nombre: string; documento: string }[];
  asuntos: { id: string; ordinal: number; descripcion: string | null; clienteId: string }[];
  initialClienteId?: string;
  initialAsuntoId?: string;
  onGuardar: (input: GastoInput) => Promise<void>;
};

export function GastoFormPagina({
  gasto,
  clientes,
  asuntos,
  initialClienteId,
  initialAsuntoId,
  onGuardar,
}: Props) {
  const router = useRouter();
  const esEdicion = Boolean(gasto);

  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState<CategoriaGasto>("OTROS");
  const [oficinaPublica, setOficinaPublica] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fecha, setFecha] = useState(hoyIso());
  const [fechaVencimiento, setFechaVencimiento] = useState("");
  const [importe, setImporte] = useState("");
  const [moneda, setMoneda] = useState<MonedaGasto>("PESOS");
  const [estado, setEstado] = useState<EstadoGasto>("PENDIENTE");
  const [observaciones, setObservaciones] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [asuntoId, setAsuntoId] = useState("");
  const [catalogoItemId, setCatalogoItemId] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [inicializado, setInicializado] = useState(false);

  useEffect(() => {
    if (inicializado) return;
    if (gasto) {
      setNombre(gasto.nombre);
      setCategoria(gasto.categoria);
      setOficinaPublica(gasto.oficinaPublica ?? "");
      setDescripcion(gasto.descripcion ?? "");
      setFecha(gasto.fecha.slice(0, 10));
      setFechaVencimiento(gasto.fechaVencimiento?.slice(0, 10) ?? "");
      setImporte(String(gasto.importe));
      setMoneda(gasto.moneda);
      setEstado(gasto.estado);
      setObservaciones(gasto.observaciones ?? "");
      setClienteId(gasto.clienteId ?? "");
      setAsuntoId(gasto.asuntoId ?? "");
      setCatalogoItemId(gasto.catalogoItemId ?? "");
    } else {
      setClienteId(initialClienteId ?? "");
      setAsuntoId(initialAsuntoId ?? "");
    }
    setInicializado(true);
  }, [gasto, initialClienteId, initialAsuntoId, inicializado]);

  const asuntosFiltrados = clienteId ? asuntos.filter((a) => a.clienteId === clienteId) : asuntos;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const imp = Number(importe.replace(",", "."));
    if (!nombre.trim()) {
      setError("El nombre del gasto es obligatorio.");
      return;
    }
    if (!Number.isFinite(imp) || imp < 0) {
      setError("Ingresá un importe válido.");
      return;
    }
    setGuardando(true);
    try {
      await onGuardar({
        nombre: nombre.trim(),
        categoria,
        oficinaPublica: oficinaPublica.trim() || null,
        descripcion: descripcion.trim() || null,
        fecha,
        fechaVencimiento: fechaVencimiento || null,
        importe: imp,
        moneda,
        estado,
        observaciones: observaciones.trim() || null,
        catalogoItemId: catalogoItemId || null,
        clienteId: clienteId || null,
        asuntoId: asuntoId || null,
      });
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
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            {esEdicion ? "Editar gasto" : "Nuevo gasto"}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Completá los datos del trámite. Luego podés incluirlo en un presupuesto al cliente.
          </p>
        </div>
        <FlujoGastosBar pasoActivo="gastos" />
      </header>

      <form
        id="gasto-form-pagina"
        onSubmit={(e) => void handleSubmit(e)}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="min-h-0 flex-1 space-y-4 pb-24">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-4">
              <FormSection title="Datos del gasto" description="Concepto e importe del trámite.">
                <div>
                  <FieldLabel htmlFor="g-nombre">Nombre *</FieldLabel>
                  <input
                    id="g-nombre"
                    className={fieldInput}
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej. Inscripción Registro de Propiedad"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <FieldLabel htmlFor="g-cat">Categoría</FieldLabel>
                    <select
                      id="g-cat"
                      className={fieldInput}
                      value={categoria}
                      onChange={(e) => setCategoria(e.target.value as CategoriaGasto)}
                    >
                      {CATEGORIAS_GASTO.map((c) => (
                        <option key={c} value={c}>{ETIQUETA_CATEGORIA[c]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <FieldLabel htmlFor="g-oficina">Oficina pública</FieldLabel>
                    <input
                      id="g-oficina"
                      className={fieldInput}
                      value={oficinaPublica}
                      onChange={(e) => setOficinaPublica(e.target.value)}
                      placeholder="Registro, DGI, IMPO…"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <FieldLabel htmlFor="g-importe">Importe</FieldLabel>
                    <input
                      id="g-importe"
                      className={cn(fieldInput, "text-base font-medium tabular-nums")}
                      value={importe}
                      onChange={(e) => setImporte(e.target.value)}
                      inputMode="decimal"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="g-moneda">Moneda</FieldLabel>
                    <select
                      id="g-moneda"
                      className={fieldInput}
                      value={moneda}
                      onChange={(e) => setMoneda(e.target.value as MonedaGasto)}
                    >
                      {MONEDAS.map((m) => (
                        <option key={m} value={m}>{ETIQUETA_MONEDA[m]}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </FormSection>

              <FormSection title="Fechas">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <FieldLabel htmlFor="g-fecha">Fecha del gasto</FieldLabel>
                    <input
                      id="g-fecha"
                      type="date"
                      className={fieldInput}
                      value={fecha}
                      onChange={(e) => setFecha(e.target.value)}
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="g-venc">Vencimiento</FieldLabel>
                    <input
                      id="g-venc"
                      type="date"
                      className={fieldInput}
                      value={fechaVencimiento}
                      onChange={(e) => setFechaVencimiento(e.target.value)}
                    />
                  </div>
                </div>
              </FormSection>
            </div>

            <div className="space-y-4">
              <FormSection
                title="Relación"
                description="Vinculá el gasto al cliente y asunto para usarlo en presupuestos."
              >
                <div>
                  <FieldLabel htmlFor="g-cliente">Cliente</FieldLabel>
                  <select
                    id="g-cliente"
                    className={fieldInput}
                    value={clienteId}
                    onChange={(e) => {
                      setClienteId(e.target.value);
                      setAsuntoId("");
                    }}
                  >
                    <option value="">Sin vincular</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel htmlFor="g-asunto">Asunto</FieldLabel>
                  <select
                    id="g-asunto"
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
                    <p className="mt-0.5 text-[11px] text-neutral-500">
                      Después de guardar, incluí este gasto en el presupuesto del trámite.
                    </p>
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

              <FormSection title="Detalles">
                <div>
                  <FieldLabel htmlFor="g-desc">Descripción</FieldLabel>
                  <textarea
                    id="g-desc"
                    className={cn(fieldInput, "min-h-[72px] resize-y")}
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Detalle del trámite o concepto facturado"
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="g-obs">Observaciones internas</FieldLabel>
                  <textarea
                    id="g-obs"
                    className={cn(fieldInput, "min-h-[56px] resize-y")}
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    placeholder="Notas del estudio (opcional)"
                  />
                </div>
              </FormSection>
            </div>
          </div>

          {error ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>
          ) : null}
        </div>

        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200/90 bg-white/95 px-4 py-4 backdrop-blur-sm sm:static sm:mt-auto sm:border-t sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
          <div className="mx-auto flex max-w-5xl flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Link href="/estudio/gastos" className={cn(estudioTw.btnSecondary, "text-center")}>
              Cancelar
            </Link>
            <button type="submit" className={estudioTw.btnPrimary} disabled={guardando}>
              {guardando ? "Guardando…" : esEdicion ? "Guardar cambios" : "Registrar gasto"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
