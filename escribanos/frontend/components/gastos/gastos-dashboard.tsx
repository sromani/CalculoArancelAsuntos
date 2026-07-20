"use client";

import { cn } from "@/lib/cn";
import { diasHastaVencimiento } from "@/lib/gastos/estado";
import { fmtFecha, fmtImporte } from "@/lib/gastos/resumen";
import type { GastoRow, ResumenGastos } from "@/lib/gastos/types";
import { GastoBadge, KpiMini } from "@/components/gastos/gastos-ui";
import { IconAlert, IconCalendar } from "@/components/gastos/icons";

function BarChart({ data }: { data: { label: string; total: number }[] }) {
  const max = Math.max(...data.map((d) => d.total), 1);
  const h = 80;
  const w = 280;
  const barW = data.length ? w / data.length - 6 : 0;

  return (
    <svg viewBox={`0 0 ${w} ${h + 24}`} className="w-full max-w-[320px]" aria-hidden>
      {data.map((d, i) => {
        const barH = Math.max(4, (d.total / max) * h);
        const x = i * (barW + 6) + 3;
        const y = h - barH;
        return (
          <g key={d.label}>
            <rect x={x} y={y} width={barW} height={barH} rx="3" className="fill-emerald-500/75" />
            <text x={x + barW / 2} y={h + 14} textAnchor="middle" className="fill-neutral-500 text-[8px]">
              {d.label.split(" ")[0]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function GastosDashboard({
  resumen,
  lista,
  cargando,
  onFiltrarVencidos,
  onFiltrarPendientes,
}: {
  resumen: ResumenGastos | null;
  lista: GastoRow[];
  cargando: boolean;
  onFiltrarVencidos?: () => void;
  onFiltrarPendientes?: () => void;
}) {
  if (cargando && !resumen) {
    return (
      <div className="grid gap-3 lg:grid-cols-[1fr_280px]">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[72px] animate-pulse rounded-xl bg-neutral-200/50" />
          ))}
        </div>
        <div className="h-40 animate-pulse rounded-xl bg-neutral-200/50" />
      </div>
    );
  }

  if (!resumen) return null;

  const proximosVenc = lista
    .filter((g) => g.estado !== "PAGO_REALIZADO" && g.fechaVencimiento)
    .map((g) => ({
      g,
      dias: diasHastaVencimiento(new Date(g.fechaVencimiento!)),
    }))
    .filter((x) => x.dias !== null && x.dias <= 14)
    .sort((a, b) => (a.dias ?? 99) - (b.dias ?? 99))
    .slice(0, 5);

  const chartData = resumen.porMes
    .slice(0, 6)
    .reverse()
    .map((m) => ({ label: m.label, total: m.total }));

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_minmax(260px,300px)]">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiMini label="Total" value={fmtImporte(resumen.totalGastos)} hint="En pesos" />
          <button type="button" className="text-left" onClick={onFiltrarPendientes}>
            <KpiMini
              label="Pendientes"
              value={String(resumen.cantidadPendientes)}
              hint={fmtImporte(resumen.totalPendiente)}
              tone="amber"
            />
          </button>
          <button type="button" className="text-left" onClick={onFiltrarVencidos}>
            <KpiMini
              label="Vencidos"
              value={String(resumen.cantidadVencidos)}
              hint={fmtImporte(resumen.totalVencido)}
              tone={resumen.cantidadVencidos > 0 ? "rose" : "neutral"}
            />
          </button>
          <KpiMini
            label="Este mes"
            value={fmtImporte(resumen.gastosDelMes)}
            hint={`${resumen.cantidadDelMes} gastos`}
            tone="emerald"
          />
        </div>

        <div className="rounded-xl border border-neutral-200/90 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-neutral-800">Evolución mensual</p>
            <span className="text-[10px] text-neutral-500">Últimos 6 meses · $ UYU</span>
          </div>
          {chartData.length > 0 ? (
            <div className="mt-3 flex justify-center sm:justify-start">
              <BarChart data={chartData} />
            </div>
          ) : (
            <p className="mt-4 text-xs text-neutral-500">Sin movimientos registrados aún.</p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200/90 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <IconCalendar className="size-4 text-neutral-500" />
          <p className="text-xs font-semibold text-neutral-800">Próximos vencimientos</p>
        </div>
        <ul className="mt-3 space-y-2">
          {proximosVenc.length === 0 ? (
            <li className="rounded-lg bg-neutral-50 px-3 py-4 text-center text-xs text-neutral-500">
              No hay vencimientos en los próximos 14 días.
            </li>
          ) : (
            proximosVenc.map(({ g, dias }) => (
              <li
                key={g.id}
                className={cn(
                  "rounded-lg border px-3 py-2 transition hover:bg-neutral-50",
                  (dias ?? 0) < 0 ? "border-rose-200/80 bg-rose-50/30" : "border-neutral-100"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-neutral-900">{g.nombre}</p>
                    <p className="text-[10px] text-neutral-500">
                      {fmtFecha(g.fechaVencimiento)}
                      {g.cliente ? ` · ${g.cliente.nombre}` : ""}
                    </p>
                  </div>
                  <GastoBadge tone={(dias ?? 0) < 0 ? "rose" : "amber"}>
                    {(dias ?? 0) < 0 ? "Vencido" : `${dias}d`}
                  </GastoBadge>
                </div>
              </li>
            ))
          )}
        </ul>
        {resumen.cantidadVencidos > 0 ? (
          <button
            type="button"
            onClick={onFiltrarVencidos}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50/50 py-2 text-xs font-medium text-rose-800 hover:bg-rose-50"
          >
            <IconAlert className="size-3.5" />
            Ver {resumen.cantidadVencidos} vencido(s)
          </button>
        ) : null}
      </div>
    </div>
  );
}
