"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { EstudioSubNav } from "@/components/layout/estudio-subnav";
import { estudioPageWrapClass } from "@/lib/estudio-estilos";
import { estudioTw } from "@/lib/estudio-tw";
import { cn } from "@/lib/cn";

/**
 * Rutas bajo /estudio (clientes, asuntos, cuenta): sesión Nest + cookies de estudio.
 * Contenido debajo del navbar del sitio; columna centrada `.estudio-page-wrap` (misma anchura que el menú).
 */
export default function LayoutEstudioProtegido({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading, syncEstudioCookies } = useAuth();
  const router = useRouter();
  const [fase, setFase] = useState<"inicial" | "listo" | "error">("inicial");
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) {
      return;
    }
    if (!isAuthenticated) {
      router.replace("/login?next=/estudio/clientes");
      return;
    }
    void (async () => {
      const { ok, error } = await syncEstudioCookies();
      if (!ok) {
        setMensajeError(error ?? "No se pudo activar la sesión del estudio.");
        setFase("error");
        return;
      }
      setFase("listo");
    })();
  }, [loading, isAuthenticated, router, syncEstudioCookies]);

  if (loading) {
    return (
      <div className="estudio-shell estudio-tema-marca w-full min-w-0">
        <main
          className={cn(estudioPageWrapClass, "estudio-main flex min-h-[45vh] items-center justify-center text-center")}
        >
          <p className={estudioTw.body}>Cargando…</p>
        </main>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (fase === "inicial") {
    return (
      <div className="estudio-shell estudio-tema-marca w-full min-w-0">
        <main
          className={cn(estudioPageWrapClass, "estudio-main flex min-h-[45vh] items-center justify-center text-center")}
        >
          <p className={estudioTw.body}>Preparando sesión…</p>
        </main>
      </div>
    );
  }

  if (fase === "error") {
    return (
      <div className="estudio-shell estudio-tema-marca w-full min-w-0">
        <main className={cn(estudioPageWrapClass, "estudio-main py-12 text-center")}>
          <p className="whitespace-pre-wrap text-red-800">{mensajeError}</p>
          <p className={cn("mt-4 text-justify", estudioTw.bodySm)}>
            Comprobaciones rápidas: backend API en 4000 · Postgres con la base del estudio ·{" "}
            <code className="rounded bg-neutral-100 px-1">DATABASE_URL</code> y{" "}
            <code className="rounded bg-neutral-100 px-1">BACKEND_API_URL</code> en{" "}
            <code className="rounded bg-neutral-100 px-1">.env.local</code> (
            <code className="rounded bg-neutral-100 px-1">http://127.0.0.1:4000/api/v1</code>
            ).
          </p>
          <button
            type="button"
            className="mt-4 text-sm font-medium text-emerald-700 underline transition hover:text-emerald-800"
            onClick={() => window.location.reload()}
          >
            Reintentar
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="estudio-shell estudio-tema-marca w-full min-w-0">
      <EstudioSubNav />
      <main className={cn(estudioPageWrapClass, "estudio-main min-w-0")}>{children}</main>
    </div>
  );
}
