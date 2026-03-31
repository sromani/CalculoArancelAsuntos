"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { APP_VERSION } from "@/lib/version";

type RolMe =
  | "ADMIN"
  | "USUARIO"
  | "SOCIO"
  | "PROFESIONAL"
  | "COLABORADOR"
  | "CONTADOR"
  | "SOLO_LECTURA";

type Me = {
  id: string;
  usuario: string;
  nombre: string;
  rol: RolMe;
};

export function BarraNavegacion() {
  const pathname = usePathname();
  const [me, setMe] = useState<Me | null | undefined>(undefined);
  const ultimoPingRef = useRef(0);

  const cargarMe = useCallback(async () => {
    if (pathname === "/login") {
      setMe(null);
      return;
    }
    try {
      const response = await fetch("/api/auth/me");
      if (!response.ok) {
        setMe(null);
        return;
      }
      const data = (await response.json()) as Me;
      setMe(data);
    } catch {
      setMe(null);
    }
  }, [pathname]);

  useEffect(() => {
    void cargarMe().catch(() => setMe(null));
  }, [cargarMe]);

  useEffect(() => {
    if (pathname === "/login") {
      return;
    }

    const eventos: (keyof WindowEventMap)[] = [
      "click",
      "keydown",
      "mousemove",
      "scroll",
      "touchstart",
    ];

    const onActividad = () => {
      const ahora = Date.now();
      if (ahora - ultimoPingRef.current < 60_000) {
        return;
      }
      ultimoPingRef.current = ahora;
      void fetch("/api/auth/me", { cache: "no-store" }).catch(() => undefined);
    };

    for (const e of eventos) {
      window.addEventListener(e, onActividad, { passive: true });
    }
    return () => {
      for (const e of eventos) {
        window.removeEventListener(e, onActividad);
      }
    };
  }, [pathname]);

  async function cerrarSesion() {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {
      // seguir
    }
    try {
      localStorage.removeItem("token");
    } catch {
      // ignore
    }
    window.location.assign("/login");
  }

  return (
    <header className="estudio-nav-header">
      <nav className="estudio-nav-inner nav-barra-oneline flex w-full flex-nowrap items-center gap-x-2 overflow-x-auto overflow-y-hidden md:gap-x-3">
        <Link
          className={`estudio-nav-brand min-w-0 shrink-0 font-bold leading-tight tracking-tight text-[var(--verde-titulo)] sm:whitespace-nowrap sm:leading-none md:text-base ${pathname === "/estudio" ? "estudio-nav-brand--active" : ""}`}
          href="/estudio"
          title="Gestión estudio"
        >
          Gestión estudio
        </Link>
        <span className="hidden h-5 w-px shrink-0 bg-[rgba(0,166,81,0.35)] sm:block" aria-hidden />
        <div className="flex shrink-0 flex-nowrap items-center gap-x-1 sm:gap-x-2 md:gap-x-3">
          <Link
            className={`estudio-nav-link whitespace-nowrap ${pathname.startsWith("/estudio/asuntos") ? "estudio-nav-link--active" : ""}`}
            href="/estudio/asuntos"
          >
            Asuntos
          </Link>
          <Link
            className={`estudio-nav-link whitespace-nowrap ${pathname.startsWith("/estudio/clientes") ? "estudio-nav-link--active" : ""}`}
            href="/estudio/clientes"
            title="Directorio de clientes"
          >
            Clientes
          </Link>
          {me?.rol === "ADMIN" ? (
            <Link
              className={`estudio-nav-link whitespace-nowrap ${pathname.startsWith("/estudio/maestros") ? "estudio-nav-link--active" : ""}`}
              href="/estudio/maestros"
            >
              Socios y Equipo
            </Link>
          ) : null}
          {me?.rol === "ADMIN" ? (
            <Link
              className={`estudio-nav-link whitespace-nowrap ${pathname.startsWith("/estudio/admin") ? "estudio-nav-link--active" : ""}`}
              href="/estudio/admin/usuarios"
            >
              Usuarios
            </Link>
          ) : null}
        </div>
        <span className="min-w-2 shrink grow basis-0" aria-hidden />
        <div className="flex shrink-0 flex-nowrap items-center gap-x-2 md:gap-x-3">
          <Link className="estudio-nav-link hidden whitespace-nowrap sm:inline" href="/">
            Sitio público
          </Link>
          <span
            className="shrink-0 text-[10px] font-medium leading-none text-[var(--verde-oscuro)]/80 whitespace-nowrap sm:text-xs"
            title={`Versión ${APP_VERSION}`}
          >
            v{APP_VERSION}
          </span>
          {me ? (
            <span className="hidden max-w-[10rem] truncate text-sm text-[var(--verde-titulo)] md:inline lg:max-w-[14rem]">
              {me.nombre} <span className="opacity-70">({me.usuario})</span>
            </span>
          ) : me === undefined ? (
            <span className="text-sm text-[var(--gris-texto)] whitespace-nowrap">...</span>
          ) : null}
          <button
            className="estudio-logout-btn"
            type="button"
            onClick={() => void cerrarSesion().catch(() => window.location.assign("/login"))}
          >
            Salir
          </button>
        </div>
      </nav>
    </header>
  );
}
