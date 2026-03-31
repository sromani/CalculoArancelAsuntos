"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BarraNavegacion } from "@/components/barra-navegacion";
import { useAuth } from "@/app/context/AuthContext";

/**
 * Gestión del estudio contable: sin redirect en middleware ni layout servidor.
 * Quien entra logueado (token Nest en localStorage) sincroniza cookies y ve el módulo.
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
      router.replace("/login?next=/estudio");
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
      <div className="estudio-main mx-auto flex min-h-[50vh] items-center justify-center px-4">
        <p className="text-[var(--gris-texto)]">Cargando gestión del estudio…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (fase === "inicial") {
    return (
      <div className="estudio-main mx-auto flex min-h-[50vh] items-center justify-center px-4">
        <p className="text-[var(--gris-texto)]">Preparando sesión del estudio…</p>
      </div>
    );
  }

  if (fase === "error") {
    return (
      <div className="estudio-main mx-auto max-w-lg px-4 py-12">
        <p className="text-red-800 whitespace-pre-wrap">{mensajeError}</p>
        <p className="mt-4 text-sm text-[var(--gris-texto)]">
          Comprobaciones rápidas: backend Nest en 3001 · Postgres con la base del estudio ·{" "}
          <code className="rounded bg-neutral-100 px-1">DATABASE_URL</code> y{" "}
          <code className="rounded bg-neutral-100 px-1">NEST_INTERNAL_URL</code> en{" "}
          <code className="rounded bg-neutral-100 px-1">.env.local</code>.
        </p>
        <button
          type="button"
          className="mt-4 text-[var(--verde-principal)] underline"
          onClick={() => window.location.reload()}
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <>
      <BarraNavegacion />
      <main className="estudio-main estudio-tema-marca mx-auto min-w-0 max-w-5xl px-3 py-5 sm:px-4 sm:py-8">
        {children}
      </main>
    </>
  );
}
