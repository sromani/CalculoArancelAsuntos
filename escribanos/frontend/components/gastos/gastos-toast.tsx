"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type ToastKind = "ok" | "error" | "info";

type ToastCtx = { toast: (msg: string, kind?: ToastKind) => void };

const Ctx = createContext<ToastCtx | null>(null);

export function GastosToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<{ text: string; kind: ToastKind } | null>(null);

  const toast = useCallback((text: string, kind: ToastKind = "info") => {
    setMsg({ text, kind });
    setTimeout(() => setMsg(null), 4000);
  }, []);

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      {msg ? (
        <div
          className={`fixed bottom-6 right-6 z-[100] max-w-sm rounded-xl px-4 py-3 text-sm shadow-lg ${
            msg.kind === "ok"
              ? "bg-emerald-700 text-white"
              : msg.kind === "error"
                ? "bg-rose-700 text-white"
                : "bg-neutral-800 text-white"
          }`}
          role="status"
        >
          {msg.text}
        </div>
      ) : null}
    </Ctx.Provider>
  );
}

export function useGastosToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useGastosToast debe usarse dentro de GastosToastProvider");
  return ctx;
}
