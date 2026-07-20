"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { esAdministrador, puedeGestionarMaestrosEstudio } from "@/lib/roles-app";
import type { RolSesion } from "@/lib/session-token";
import { cn } from "@/lib/cn";

type NavItem = {
  href: string;
  label: string;
  match: (path: string) => boolean;
  visible?: (rol: RolSesion | null) => boolean;
};

const MODULOS: NavItem[] = [
  {
    href: "/estudio/clientes",
    label: "Clientes",
    match: (p) => p.startsWith("/estudio/clientes"),
  },
  {
    href: "/estudio/asuntos",
    label: "Asuntos",
    match: (p) => p.startsWith("/estudio/asuntos"),
  },
  {
    href: "/estudio/gastos",
    label: "Gastos",
    match: (p) => p.startsWith("/estudio/gastos"),
  },
  {
    href: "/estudio/presupuestos",
    label: "Presupuestos",
    match: (p) => p.startsWith("/estudio/presupuestos"),
  },
  {
    href: "/estudio/maestros",
    label: "Maestros",
    match: (p) => p.startsWith("/estudio/maestros"),
    visible: (rol) => Boolean(rol && puedeGestionarMaestrosEstudio(rol)),
  },
  {
    href: "/estudio/admin/usuarios",
    label: "Usuarios",
    match: (p) => p.startsWith("/estudio/admin"),
    visible: (rol) => Boolean(rol && esAdministrador(rol)),
  },
  {
    href: "/estudio/cuenta",
    label: "Mi cuenta",
    match: (p) => p.startsWith("/estudio/cuenta"),
  },
];

function linkClass(active: boolean) {
  return cn("estudio-nav-link shrink-0", active && "estudio-nav-link--active");
}

export function EstudioSubNav() {
  const pathname = usePathname() ?? "";
  const [rol, setRol] = useState<RolSesion | null>(null);

  useEffect(() => {
    let cancel = false;
    void (async () => {
      try {
        const r = await fetch("/api/auth/me", { cache: "no-store" });
        if (!r.ok) return;
        const me = (await r.json()) as { rol?: RolSesion };
        if (!cancel && me.rol) setRol(me.rol);
      } catch {
        /* sin rol: solo módulos base */
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  const items = MODULOS.filter((m) => !m.visible || m.visible(rol));

  return (
    <nav className="estudio-nav-header sticky top-[var(--navbar-app-height)] z-40" aria-label="Módulos del estudio">
      <div className="estudio-nav-inner flex items-center gap-1 overflow-x-auto sm:gap-2">
        <Link
          href="/estudio/clientes"
          className={cn(
            "estudio-nav-brand mr-1 hidden text-sm font-semibold text-[var(--verde-titulo)] sm:mr-2 sm:inline-flex",
            pathname.startsWith("/estudio") && "estudio-nav-brand--active",
          )}
        >
          Gestión
        </Link>
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={linkClass(item.match(pathname))}
            aria-current={item.match(pathname) ? "page" : undefined}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
