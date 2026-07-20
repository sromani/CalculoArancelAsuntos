"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { PresupuestoInput, PresupuestoRow } from "@/lib/presupuestos/types";
import type { GastoRow } from "@/lib/gastos/types";

export function usePresupuestos(filtrosIniciales: { clienteId?: string; asuntoId?: string } = {}) {
  const [lista, setLista] = useState<PresupuestoRow[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const recargar = useCallback(async () => {
    setCargando(true);
    setError("");
    const p = new URLSearchParams();
    if (filtrosIniciales.clienteId) p.set("clienteId", filtrosIniciales.clienteId);
    if (filtrosIniciales.asuntoId) p.set("asuntoId", filtrosIniciales.asuntoId);
    const qs = p.toString() ? `?${p}` : "";
    try {
      const r = await fetch(`/api/presupuestos${qs}`);
      const data = await r.json();
      if (!r.ok) {
        setError(data?.error ?? "Error al cargar presupuestos.");
        setLista([]);
      } else {
        setLista(data as PresupuestoRow[]);
      }
    } catch {
      setError("Error de conexión.");
    } finally {
      setCargando(false);
    }
  }, [filtrosIniciales.clienteId, filtrosIniciales.asuntoId]);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  const crear = useCallback(async (input: PresupuestoInput & { totalGastos?: number; totalPresupuesto?: number }) => {
    const r = await fetch("/api/presupuestos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data?.error ?? "No se pudo crear.");
    return data as PresupuestoRow;
  }, []);

  const actualizar = useCallback(async (id: string, input: PresupuestoInput & { totalGastos?: number; totalPresupuesto?: number }) => {
    const r = await fetch(`/api/presupuestos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data?.error ?? "No se pudo actualizar.");
    return data as PresupuestoRow;
  }, []);

  const duplicar = useCallback(async (id: string) => {
    const r = await fetch(`/api/presupuestos/${id}/duplicar`, { method: "POST" });
    const data = await r.json();
    if (!r.ok) throw new Error(data?.error ?? "No se pudo duplicar.");
    return data as PresupuestoRow;
  }, []);

  return { lista, cargando, error, recargar, crear, actualizar, duplicar };
}

export function useGastosParaPresupuesto(clienteId?: string, asuntoId?: string) {
  const [gastos, setGastos] = useState<GastoRow[]>([]);

  useEffect(() => {
    void (async () => {
      const p = new URLSearchParams({ pageSize: "100" });
      if (clienteId) p.set("clienteId", clienteId);
      if (asuntoId) p.set("asuntoId", asuntoId);
      const r = await fetch(`/api/gastos?${p}`);
      const data = await r.json();
      if (r.ok) setGastos(data.items as GastoRow[]);
    })();
  }, [clienteId, asuntoId]);

  return gastos;
}
