"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

type Notif = {
  id: string;
  titulo: string;
  mensaje: string;
  enlace: string | null;
  leida: boolean;
  createdAt: string;
};

export function CentroNotificaciones() {
  const [abierto, setAbierto] = useState(false);
  const [items, setItems] = useState<Notif[]>([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const cargar = useCallback(async () => {
    try {
      const r = await fetch("/api/notificaciones");
      const data = await r.json();
      if (r.ok) {
        setItems(data.items as Notif[]);
        setNoLeidas(data.noLeidas as number);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void cargar();
    const t = setInterval(() => void cargar(), 120_000);
    return () => clearInterval(t);
  }, [cargar]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false);
    }
    if (abierto) document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [abierto]);

  async function marcarLeidas() {
    await fetch("/api/notificaciones", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ todas: true }),
    });
    await cargar();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className={cn(
          "relative rounded-lg p-2 transition",
          noLeidas > 0 ? "text-neutral-900 hover:bg-neutral-100" : "text-neutral-600 hover:bg-neutral-100"
        )}
        aria-label={`Notificaciones${noLeidas > 0 ? `, ${noLeidas} sin leer` : ""}`}
        onClick={() => setAbierto((v) => !v)}
      >
        <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M15 17H9l-1 2h8l-1-2z" strokeLinejoin="round" />
          <path d="M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7" strokeLinejoin="round" />
        </svg>
        {noLeidas > 0 ? (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {noLeidas > 9 ? "9+" : noLeidas}
          </span>
        ) : null}
      </button>

      {abierto ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-neutral-200/90 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-neutral-100 bg-neutral-50/80 px-4 py-3">
            <span className="text-sm font-semibold text-neutral-900">Alertas</span>
            {noLeidas > 0 ? (
              <button type="button" className="text-xs font-medium text-emerald-700 hover:underline" onClick={() => void marcarLeidas()}>
                Marcar leídas
              </button>
            ) : null}
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-neutral-500">Sin alertas pendientes</li>
            ) : (
              items.map((n) => (
                <li
                  key={n.id}
                  className={cn(
                    "border-b border-neutral-50 px-4 py-3 transition hover:bg-neutral-50/80",
                    !n.leida && "bg-emerald-50/25"
                  )}
                >
                  {n.enlace ? (
                    <Link href={n.enlace} className="block" onClick={() => setAbierto(false)}>
                      <p className="text-sm font-medium text-neutral-900">{n.titulo}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-neutral-600">{n.mensaje}</p>
                    </Link>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-neutral-900">{n.titulo}</p>
                      <p className="mt-0.5 text-xs text-neutral-600">{n.mensaje}</p>
                    </>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
