"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cerrarSesion, obtenerSesionLocal } from "@/lib/api";

const NAV = [
  { href: "/dashboard", label: "Inicio", icon: "◉" },
  { href: "/simulador", label: "Simulador", icon: "◎" },
  { href: "/clientes", label: "Clientes", icon: "◈" },
  { href: "/gastos", label: "Gastos", icon: "◇" },
  { href: "/presupuestos", label: "Presupuestos", icon: "◆" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const sesion = obtenerSesionLocal();

  function logout() {
    cerrarSesion();
    router.push("/login");
  }

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface)] px-3 py-5">
        <div className="mb-8 px-2">
          <Link href="/dashboard" className="flex items-center gap-3" aria-label="Inicio">
            <img
              src="/logo.png"
              alt=""
              width={44}
              height={44}
              className="h-11 w-11 shrink-0 rounded-lg object-contain"
            />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Escribanos</p>
              <h1 className="mt-0.5 text-lg font-semibold tracking-tight">Estudio</h1>
            </div>
          </Link>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-[var(--accent-soft)] font-medium text-[var(--accent-hover)]"
                    : "text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)]"
                }`}
              >
                <span className="text-xs opacity-70">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto border-t border-[var(--border)] pt-4 px-2">
          <p className="truncate text-sm font-medium">{sesion?.nombre ?? sesion?.usuario ?? "Usuario"}</p>
          <p className="truncate text-xs text-[var(--muted)]">{sesion?.rol ?? ""}</p>
          <button
            type="button"
            onClick={logout}
            className="mt-3 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--muted)] transition hover:border-[var(--danger)] hover:text-[var(--danger)]"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        {pathname === "/simulador" || pathname.startsWith("/simulador/") ? (
          children
        ) : (
          <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
        )}
      </main>
    </div>
  );
}
