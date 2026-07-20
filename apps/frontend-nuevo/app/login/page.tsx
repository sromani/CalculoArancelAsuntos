"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, guardarSesionEstudio } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await api.loginEstudio({ usuario, password });
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    guardarSesionEstudio(res.data);
    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="fixed left-4 top-4 sm:left-6 sm:top-6">
        <img
          src="/logo.png"
          alt="Escribanos Estudio"
          width={44}
          height={44}
          className="h-11 w-11 rounded-lg object-contain"
        />
      </div>
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--accent)]">Escribanos</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Acceso al estudio</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Usá las mismas credenciales que en el sistema actual (email y contraseña del sitio, o usuario del estudio).
          </p>
        </div>
        <form onSubmit={onSubmit} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
          <label className="block text-sm">
            Usuario o email
            <input
              type="text"
              autoComplete="username"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
              required
            />
          </label>
          <label className="mt-4 block text-sm">
            Contraseña
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
              required
            />
          </label>
          {error && <p className="mt-4 text-sm text-[var(--danger)]">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-lg bg-[var(--accent)] py-2.5 text-sm font-medium text-white transition hover:bg-[var(--accent-hover)] disabled:opacity-60"
          >
            {loading ? "Entrando…" : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}
