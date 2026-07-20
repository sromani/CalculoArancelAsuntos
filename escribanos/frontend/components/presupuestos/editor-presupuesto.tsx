"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { calcularDesglosePresupuestoHonario, formatearMontoEnMoneda } from "@/lib/arancel/liquido-escribano";
import type { MonedaEntrada, TasasLineas } from "@/lib/arancel/conversion";
import { parseHonorarioACobrarInput } from "@/lib/arancel/liquido-escribano";
import { sumarGastosPesos } from "@/lib/presupuestos/calculo";
import { estudioTw } from "@/lib/estudio-tw";
import { fmtImporte } from "@/lib/gastos/resumen";
import { ETIQUETA_ESTADO_PRESUPUESTO, CLASE_ESTADO_PRESUPUESTO } from "@/lib/presupuestos/types";
import { useGastosParaPresupuesto } from "@/components/presupuestos/use-presupuestos";
import { EstudioButton, EstudioLinkButton } from "@/components/ui/estudio-button";
import { FlujoGastosBar } from "@/components/gastos/flujo-gastos-bar";
import { GastosToastProvider, useGastosToast } from "@/components/gastos/gastos-toast";
import type { PresupuestoRow } from "@/lib/presupuestos/types";

type Props = {
  presupuesto?: PresupuestoRow | null;
  initialClienteId?: string;
  initialAsuntoId?: string;
  clientes: { id: string; nombre: string }[];
  asuntos: { id: string; ordinal: number; descripcion: string | null; clienteId: string }[];
  onGuardar: (payload: Record<string, unknown>) => Promise<PresupuestoRow>;
};

function EditorPresupuestoInner({
  presupuesto,
  initialClienteId,
  initialAsuntoId,
  clientes,
  asuntos,
  onGuardar,
}: Props) {
  const router = useRouter();
  const { toast } = useGastosToast();

  const [clienteId, setClienteId] = useState(presupuesto?.clienteId ?? initialClienteId ?? "");
  const [asuntoId, setAsuntoId] = useState(presupuesto?.asuntoId ?? initialAsuntoId ?? "");
  const [titulo, setTitulo] = useState(presupuesto?.titulo ?? "");
  const [honorarioArancelStr, setHonorarioArancelStr] = useState(String(presupuesto?.honorarioArancel ?? ""));
  const [honorarioCobrarStr, setHonorarioCobrarStr] = useState(String(presupuesto?.honorarioACobrar ?? ""));
  const [fonasaPct, setFonasaPct] = useState(String(presupuesto?.fonasaPct ?? 6));
  const [irpfPct, setIrpfPct] = useState(String(presupuesto?.irpfPct ?? 15));
  const [moneda] = useState<MonedaEntrada>((presupuesto?.monedaHonorario as MonedaEntrada) ?? "UYU");
  const [gastosSel, setGastosSel] = useState<Set<string>>(
    new Set(presupuesto?.lineasGastos.map((l) => l.gastoId) ?? [])
  );
  const [estado, setEstado] = useState(presupuesto?.estado ?? "BORRADOR");
  const [notas, setNotas] = useState(presupuesto?.notas ?? "");
  const [tasas, setTasas] = useState<TasasLineas | null>(null);
  const [guardando, setGuardando] = useState(false);

  const gastos = useGastosParaPresupuesto(clienteId || undefined, asuntoId || undefined);

  useEffect(() => {
    void (async () => {
      const hoy = new Date().toISOString().slice(0, 10);
      const r = await fetch(`/api/cotizaciones-bcu?fecha=${hoy}`);
      const data = await r.json();
      if (r.ok) {
        setTasas({
          dolarComprador: data.dolarComprador,
          uiPesos: data.uiPesos,
          urSemestralPesos: data.urSemestralPesos,
        });
      }
    })();
  }, []);

  useEffect(() => {
    const raw = sessionStorage.getItem("presupuesto_desde_simulador");
    if (!raw || presupuesto) return;
    try {
      const d = JSON.parse(raw) as {
        honorarioArancel: number;
        honorarioACobrar: number;
        fonasaPct: number;
        irpfPct: number;
        actoDescripcion?: string;
      };
      setHonorarioArancelStr(String(d.honorarioArancel));
      setHonorarioCobrarStr(String(d.honorarioACobrar));
      setFonasaPct(String(d.fonasaPct));
      setIrpfPct(String(d.irpfPct));
      if (d.actoDescripcion) setTitulo(d.actoDescripcion);
      sessionStorage.removeItem("presupuesto_desde_simulador");
    } catch {
      /* ignore */
    }
  }, [presupuesto]);

  const honorarioArancel = parseHonorarioACobrarInput(honorarioArancelStr) ?? 0;
  const honorarioCobrar = parseHonorarioACobrarInput(honorarioCobrarStr) ?? 0;
  const fonasaNum = Number(fonasaPct);
  const irpfNum = Number(irpfPct);

  const gastosLineas = useMemo(
    () =>
      gastos
        .filter((g) => gastosSel.has(g.id))
        .map((g) => ({ importe: g.importe, moneda: g.moneda, incluido: true })),
    [gastos, gastosSel]
  );

  const desglose = useMemo(() => {
    if (!tasas || honorarioArancel <= 0) return null;
    return calcularDesglosePresupuestoHonario(
      honorarioArancel,
      honorarioCobrar || honorarioArancel,
      moneda,
      tasas,
      fonasaNum,
      irpfNum
    );
  }, [tasas, honorarioArancel, honorarioCobrar, moneda, fonasaNum, irpfNum]);

  const totalGastos = sumarGastosPesos(gastosLineas);
  const totalPresupuesto = (desglose?.lineasPresupuesto.totalFactura ?? 0) + totalGastos;

  const asuntosFiltrados = clienteId ? asuntos.filter((a) => a.clienteId === clienteId) : asuntos;

  async function handleGuardar() {
    if (!clienteId) {
      toast("Seleccioná un cliente.", "error");
      return;
    }
    setGuardando(true);
    try {
      const payload = {
        clienteId,
        asuntoId: asuntoId || null,
        titulo: titulo || null,
        estado,
        monedaHonorario: moneda,
        honorarioArancel,
        honorarioACobrar: honorarioCobrar || honorarioArancel,
        fonasaPct: fonasaNum,
        irpfPct: irpfNum,
        desgloseArancel: desglose?.lineasArancel ?? null,
        desglosePresupuesto: desglose?.lineasPresupuesto ?? null,
        totalGastos,
        totalPresupuesto,
        notas: notas || null,
        gastoIds: [...gastosSel],
        fechaCotizacion: new Date().toISOString(),
        cotizacionesSnapshot: tasas,
      };
      const saved = await onGuardar(payload);
      toast("Presupuesto guardado.", "ok");
      router.push(`/estudio/presupuestos/${saved.id}`);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Error al guardar.", "error");
    } finally {
      setGuardando(false);
    }
  }

  function toggleGasto(id: string) {
    setGastosSel((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const fmt = (n: number) => formatearMontoEnMoneda(n, moneda);

  return (
    <div className={cn("mx-auto w-full min-w-0 max-w-7xl text-left", estudioTw.listStackY)}>
      <FlujoGastosBar pasoActivo="presupuesto" />
      <div className="panel overflow-hidden">
        <div className={cn("page-toolbar page-toolbar-wide pt-6", estudioTw.cardPadX)}>
          <div>
            <h1 className="page-title">{presupuesto ? `Presupuesto #${presupuesto.numero}` : "Nuevo presupuesto"}</h1>
            <p className="mt-1 text-sm text-neutral-600">
              Honorarios notariales + gastos seleccionados. Montepío no baja del arancel si el honorario disminuye.
            </p>
          </div>
          <div className="page-toolbar-end flex flex-wrap gap-2">
            <EstudioLinkButton href="/simulador" variant="secondary" target="_blank">
              Calcular honorarios
            </EstudioLinkButton>
            <EstudioButton type="button" variant="primary" disabled={guardando} onClick={() => void handleGuardar()}>
              {guardando ? "Guardando…" : estado === "BORRADOR" ? "Guardar borrador" : "Guardar"}
            </EstudioButton>
          </div>
        </div>

        <div className={cn("grid gap-6 px-4 pb-8 sm:px-6 lg:grid-cols-2 lg:px-8", estudioTw.cardPadX)}>
          <div className="space-y-4">
            <div className={estudioTw.card}>
              <h2 className={estudioTw.typeListTitle}>Datos generales</h2>
              <div className="mt-4 space-y-3">
                <div>
                  <label className="form-label">Cliente *</label>
                  <select className="form-input w-full" value={clienteId} onChange={(e) => { setClienteId(e.target.value); setAsuntoId(""); }}>
                    <option value="">Seleccionar…</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Asunto</label>
                  <select className="form-input w-full" value={asuntoId} onChange={(e) => setAsuntoId(e.target.value)}>
                    <option value="">—</option>
                    {asuntosFiltrados.map((a) => (
                      <option key={a.id} value={a.id}>#{a.ordinal} {a.descripcion ?? ""}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Título</label>
                  <input className="form-input w-full" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Estado</label>
                  <select className="form-input w-full" value={estado} onChange={(e) => setEstado(e.target.value as typeof estado)}>
                    {Object.entries(ETIQUETA_ESTADO_PRESUPUESTO).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className={estudioTw.card}>
              <h2 className={estudioTw.typeListTitle}>Honorarios</h2>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Honorario arancel</label>
                  <input className="form-input w-full" value={honorarioArancelStr} onChange={(e) => setHonorarioArancelStr(e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Honorario a cobrar</label>
                  <input className="form-input w-full" value={honorarioCobrarStr} onChange={(e) => setHonorarioCobrarStr(e.target.value)} />
                </div>
                <div>
                  <label className="form-label">FONASA %</label>
                  <select className="form-input w-full" value={fonasaPct} onChange={(e) => setFonasaPct(e.target.value)}>
                    {["4.5", "6", "8"].map((v) => (
                      <option key={v} value={v}>{v}%</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">IRPF %</label>
                  <select className="form-input w-full" value={irpfPct} onChange={(e) => setIrpfPct(e.target.value)}>
                    {[0, 10, 15, 24, 25, 27, 31, 36].map((v) => (
                      <option key={v} value={v}>{v}%</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className={estudioTw.card}>
              <h2 className={estudioTw.typeListTitle}>Gastos del trámite</h2>
              <p className="mt-1 text-xs text-neutral-500">
                Seleccioná gastos previamente cargados.{" "}
                <Link href="/estudio/gastos" className="text-emerald-700 underline">Gestionar gastos</Link>
              </p>
              <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">
                {gastos.length === 0 ? (
                  <p className="text-sm text-neutral-500">No hay gastos para este cliente/asunto.</p>
                ) : (
                  gastos.map((g) => (
                    <label key={g.id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-neutral-200/80 px-3 py-2 hover:bg-neutral-50">
                      <input type="checkbox" checked={gastosSel.has(g.id)} onChange={() => toggleGasto(g.id)} />
                      <span className="min-w-0 flex-1">
                        <span className="font-medium text-neutral-900">{g.nombre}</span>
                        <span className="block text-xs text-neutral-500">{fmtImporte(g.importe, g.moneda)}</span>
                      </span>
                    </label>
                  ))
                )}
              </div>
              <p className="mt-2 text-sm font-medium tabular-nums">Total gastos: {fmtImporte(totalGastos)}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className={estudioTw.card}>
              <h2 className={estudioTw.typeListTitle}>Desglose al cliente</h2>
              {desglose ? (
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between"><dt>Honorario</dt><dd className="tabular-nums">{fmt(desglose.lineasPresupuesto.honorario)}</dd></div>
                  <div className="flex justify-between"><dt>IVA (22%)</dt><dd className="tabular-nums">{fmt(desglose.lineasPresupuesto.iva)}</dd></div>
                  <div className="flex justify-between font-medium"><dt>Total factura</dt><dd className="tabular-nums">{fmt(desglose.lineasPresupuesto.totalFactura)}</dd></div>
                  <div className="border-t border-neutral-100 pt-2" />
                  <div className="flex justify-between text-neutral-600"><dt>Montepío (19%)</dt><dd className="tabular-nums">{fmt(desglose.lineasPresupuesto.montepio)}</dd></div>
                  <div className="flex justify-between text-neutral-600"><dt>Fondo gremial</dt><dd className="tabular-nums">{fmt(desglose.lineasPresupuesto.fondoGremial)}</dd></div>
                  <div className="flex justify-between text-neutral-600"><dt>FONASA</dt><dd className="tabular-nums">{fmt(desglose.lineasPresupuesto.fonasa)}</dd></div>
                  <div className="flex justify-between text-neutral-600"><dt>IRPF estimado</dt><dd className="tabular-nums">{fmt(desglose.lineasPresupuesto.irpf)}</dd></div>
                  <div className="flex justify-between font-semibold text-emerald-800"><dt>Líquido profesional</dt><dd className="tabular-nums">{fmt(desglose.lineasPresupuesto.liquido)}</dd></div>
                  {honorarioCobrar < honorarioArancel && honorarioArancel > 0 ? (
                    <p className="text-xs text-amber-700">Montepío mantenido según honorario de arancel (no disminuye).</p>
                  ) : null}
                </dl>
              ) : (
                <p className="mt-4 text-sm text-neutral-500">Ingresá honorarios para ver el desglose.</p>
              )}
            </div>

            <div className={cn(estudioTw.card, "bg-emerald-50/40 border-emerald-200/60")}>
              <h2 className={estudioTw.typeListTitle}>Total presupuesto cliente</h2>
              <p className="mt-2 text-3xl font-semibold tabular-nums text-neutral-900">
                {fmtImporte(totalPresupuesto)}
              </p>
              <p className="text-xs text-neutral-500">Factura + gastos seleccionados (en pesos)</p>
            </div>

            <div>
              <label className="form-label">Notas internas</label>
              <textarea className="form-input w-full min-h-[80px]" value={notas} onChange={(e) => setNotas(e.target.value)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function EditorPresupuesto(props: Props) {
  return (
    <GastosToastProvider>
      <EditorPresupuestoInner {...props} />
    </GastosToastProvider>
  );
}

export function ListaPresupuestos({
  lista,
  cargando,
  onDuplicar,
}: {
  lista: PresupuestoRow[];
  cargando: boolean;
  onDuplicar?: (id: string) => void;
}) {
  if (cargando && lista.length === 0) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-neutral-200/60" />
        ))}
      </div>
    );
  }

  if (lista.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className={estudioTw.typeListTitle}>Sin presupuestos</p>
        <EstudioLinkButton href="/estudio/presupuestos/nuevo" variant="primary" className="mt-4">
          Crear presupuesto
        </EstudioLinkButton>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {lista.map((p) => (
        <div key={p.id} className={cn(estudioTw.card, "flex flex-wrap items-center justify-between gap-3 p-4")}>
          <div>
            <Link href={`/estudio/presupuestos/${p.id}`} className="font-semibold text-emerald-800 hover:underline">
              #{p.numero} {p.titulo ?? p.cliente.nombre}
            </Link>
            <p className="text-xs text-neutral-500">{p.cliente.nombre}{p.asunto ? ` · Asunto #${p.asunto.ordinal}` : ""}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={cn("rounded-full px-2 py-0.5 text-xs ring-1 ring-inset", CLASE_ESTADO_PRESUPUESTO[p.estado])}>
              {ETIQUETA_ESTADO_PRESUPUESTO[p.estado]}
            </span>
            <span className="font-semibold tabular-nums">{fmtImporte(p.totalPresupuesto)}</span>
            {onDuplicar ? (
              <EstudioButton type="button" variant="ghost" onClick={() => onDuplicar(p.id)}>
                Duplicar
              </EstudioButton>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
