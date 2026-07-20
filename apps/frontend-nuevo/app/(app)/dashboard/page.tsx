"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, obtenerSesionLocal } from "@/lib/api";
import { fmtMoney } from "@/lib/format";

export default function DashboardPage() {
  const sesion = obtenerSesionLocal();
  const [stats, setStats] = useState({ clientes: 0, gastos: 0, presupuestos: 0, pendientes: 0 });

  useEffect(() => {
    void Promise.all([api.listarClientes(), api.listarGastos({ pageSize: 1 }), api.listarPresupuestos()]).then(
      ([c, g, p]) => {
        setStats({
          clientes: c.ok ? c.data.length : 0,
          gastos: g.ok ? g.data.total : 0,
          presupuestos: p.ok ? p.data.length : 0,
          pendientes: g.ok ? g.data.items.filter((x) => x.estado === "PENDIENTE" || x.estado === "VENCIDO").length : 0,
        });
      },
    );
  }, []);

  const cards = [
    { label: "Clientes", value: String(stats.clientes), href: "/clientes" },
    { label: "Gastos registrados", value: String(stats.gastos), href: "/gastos" },
    { label: "Presupuestos", value: String(stats.presupuestos), href: "/presupuestos" },
    { label: "Gastos pendientes", value: String(stats.pendientes), href: "/gastos" },
  ];

  return (
    <div>
      <header className="mb-8">
        <p className="text-sm text-[var(--muted)]">Bienvenido</p>
        <h1 className="text-2xl font-semibold tracking-tight">{sesion?.nombre ?? sesion?.usuario}</h1>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="card transition hover:border-[var(--accent-muted)] hover:shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">{c.label}</p>
            <p className="mt-2 text-3xl font-semibold text-[var(--accent-hover)]">{c.value}</p>
          </Link>
        ))}
      </div>
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Link href="/simulador" className="card group">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">Simulador</p>
          <h2 className="mt-2 text-lg font-medium group-hover:text-[var(--accent-hover)]">Calcular honorarios</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Arancel, montepío, líquido escribano</p>
        </Link>
        <div className="card bg-[var(--surface-muted)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Referencia</p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Monto mínimo de ejemplo: {fmtMoney(0)} — configurá UR semestral en el simulador.
          </p>
        </div>
      </div>
    </div>
  );
}
