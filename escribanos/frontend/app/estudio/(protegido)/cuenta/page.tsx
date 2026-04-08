"use client";

import { useState } from "react";
import Link from "next/link";
import { estudioTw } from "@/lib/estudio-tw";
import { cn } from "@/lib/cn";

export default function CuentaCambiarContrasenaPage() {
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMensaje(null);
    setEnviando(true);
    try {
      const r = await fetch("/api/auth/cambiar-contrasena", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ actual, nueva, confirmar }),
      });
      const data = (await r.json().catch(() => ({}))) as { error?: string; message?: string };
      if (!r.ok) {
        setMensaje({ tipo: "error", texto: data.error ?? "No se pudo actualizar la contraseña." });
        return;
      }
      setMensaje({ tipo: "ok", texto: data.message ?? "Contraseña actualizada correctamente." });
      setActual("");
      setNueva("");
      setConfirmar("");
    } catch {
      setMensaje({ tipo: "error", texto: "Error de conexión." });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className={cn("mx-auto min-w-0 w-full max-w-lg", estudioTw.stack, "text-center")}>
      <div className="space-y-3">
        <Link
          href="/"
          className={cn(estudioTw.bodySm, "inline-block font-medium text-gray-500 hover:text-gray-900")}
        >
          ← Inicio
        </Link>
        <h1 className={estudioTw.h1}>Cambiar contraseña</h1>
        <p className={cn(estudioTw.body, "text-justify")}>
          En <strong className="font-semibold text-gray-900">Contraseña actual</strong> usá la misma que en el login:
          si entrás con email al sitio, esa clave; si solo usás usuario del estudio, la del módulo. La nueva clave
          debe tener al menos 6 caracteres y se guarda en el sitio y en el estudio cuando la sesión está vinculada a
          tu cuenta del sitio.
        </p>
      </div>

      <form
        onSubmit={(e) => void onSubmit(e)}
        className={cn(estudioTw.card, "w-full space-y-6 text-left")}
      >
        <div className="space-y-6">
          <label className="block">
            <span className={cn(estudioTw.label, "mb-2 block")}>Contraseña actual</span>
            <input
              className={estudioTw.inputSm}
              type="password"
              autoComplete="current-password"
              value={actual}
              onChange={(e) => setActual(e.target.value)}
              required
            />
          </label>
          <label className="block">
            <span className={cn(estudioTw.label, "mb-2 block")}>Nueva contraseña</span>
            <input
              className={estudioTw.inputSm}
              type="password"
              autoComplete="new-password"
              value={nueva}
              onChange={(e) => setNueva(e.target.value)}
              required
              minLength={6}
            />
          </label>
          <label className="block">
            <span className={cn(estudioTw.label, "mb-2 block")}>Confirmar nueva contraseña</span>
            <input
              className={estudioTw.inputSm}
              type="password"
              autoComplete="new-password"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              required
              minLength={6}
            />
          </label>
        </div>

        {mensaje ? (
          <p
            className={cn(
              "rounded-xl px-3 py-2.5 text-sm",
              mensaje.tipo === "ok"
                ? "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200/60"
                : "bg-red-50 text-red-900 ring-1 ring-red-200/60",
            )}
            role={mensaje.tipo === "error" ? "alert" : undefined}
          >
            {mensaje.texto}
          </p>
        ) : null}

        <div>
          <button type="submit" className={estudioTw.btnPrimary} disabled={enviando}>
            {enviando ? "Guardando…" : "Guardar contraseña"}
          </button>
        </div>
      </form>
    </div>
  );
}
