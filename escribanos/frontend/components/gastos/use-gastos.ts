"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  GastoCatalogoRow,
  GastoInput,
  GastoRow,
  GastosFiltros,
  GastosListadoResponse,
  ResumenGastos,
} from "@/lib/gastos/types";

type ClienteOpcion = { id: string; nombre: string; documento: string };
type AsuntoOpcion = { id: string; ordinal: number; descripcion: string | null; clienteId: string };

function buildQuery(filtros: GastosFiltros): string {
  const p = new URLSearchParams();
  if (filtros.q?.trim()) p.set("q", filtros.q.trim());
  if (filtros.fechaDesde) p.set("fechaDesde", filtros.fechaDesde);
  if (filtros.fechaHasta) p.set("fechaHasta", filtros.fechaHasta);
  if (filtros.vencimientoDesde) p.set("vencimientoDesde", filtros.vencimientoDesde);
  if (filtros.vencimientoHasta) p.set("vencimientoHasta", filtros.vencimientoHasta);
  if (filtros.clienteId) p.set("clienteId", filtros.clienteId);
  if (filtros.asuntoId) p.set("asuntoId", filtros.asuntoId);
  if (filtros.categoria) p.set("categoria", filtros.categoria);
  if (filtros.estado) p.set("estado", filtros.estado);
  if (filtros.page) p.set("page", String(filtros.page));
  if (filtros.pageSize) p.set("pageSize", String(filtros.pageSize));
  const qs = p.toString();
  return qs ? `?${qs}` : "";
}

export function useGastos(initialFiltros: GastosFiltros = {}) {
  const [filtros, setFiltros] = useState<GastosFiltros>({ page: 1, pageSize: 20, ...initialFiltros });
  const [debouncedQ, setDebouncedQ] = useState("");
  const [lista, setLista] = useState<GastoRow[]>([]);
  const [paginacion, setPaginacion] = useState({ total: 0, page: 1, pageSize: 20, totalPages: 1 });
  const [resumen, setResumen] = useState<ResumenGastos | null>(null);
  const [catalogo, setCatalogo] = useState<GastoCatalogoRow[]>([]);
  const [clientes, setClientes] = useState<ClienteOpcion[]>([]);
  const [asuntos, setAsuntos] = useState<AsuntoOpcion[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [puedeEditar, setPuedeEditar] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(filtros.q?.trim() ?? ""), 320);
    return () => clearTimeout(t);
  }, [filtros.q]);

  const filtrosQuery = useMemo(
    () => ({ ...filtros, q: debouncedQ }),
    [filtros, debouncedQ]
  );

  const recargar = useCallback(async () => {
    setCargando(true);
    setError("");
    const qs = buildQuery(filtrosQuery);
    try {
      const [rLista, rResumen, rCatalogo] = await Promise.all([
        fetch(`/api/gastos${qs}`),
        fetch(`/api/gastos/resumen${qs}`),
        fetch("/api/gastos/catalogo"),
      ]);
      const dataLista = (await rLista.json()) as GastosListadoResponse & { error?: string };
      const dataResumen = await rResumen.json();
      const dataCatalogo = await rCatalogo.json();
      if (!rLista.ok) {
        setError(dataLista?.error ?? "No se pudo cargar gastos.");
        setLista([]);
      } else {
        setLista(dataLista.items);
        setPaginacion({
          total: dataLista.total,
          page: dataLista.page,
          pageSize: dataLista.pageSize,
          totalPages: dataLista.totalPages,
        });
      }
      if (rResumen.ok) setResumen(dataResumen as ResumenGastos);
      if (rCatalogo.ok) setCatalogo(dataCatalogo as GastoCatalogoRow[]);
    } catch {
      setError("Error de conexión.");
      setLista([]);
    } finally {
      setCargando(false);
    }
  }, [filtrosQuery]);

  useEffect(() => {
    void (async () => {
      try {
        const [rC, rA, rMe] = await Promise.all([
          fetch("/api/clientes"),
          fetch("/api/asuntos"),
          fetch("/api/auth/me"),
        ]);
        const clientesData = await rC.json();
        const asuntosData = await rA.json();
        const me = await rMe.json();
        if (rC.ok) setClientes(clientesData as ClienteOpcion[]);
        if (rA.ok) {
          setAsuntos(
            (asuntosData as { id: string; ordinal: number; descripcion: string | null; clienteId: string }[]).map(
              (a) => ({
                id: a.id,
                ordinal: a.ordinal,
                descripcion: a.descripcion,
                clienteId: a.clienteId,
              })
            )
          );
        }
        if (rMe.ok && me?.rol === "SOLO_LECTURA") setPuedeEditar(false);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  const crear = useCallback(async (input: GastoInput) => {
    const r = await fetch("/api/gastos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data?.error ?? "No se pudo crear el gasto.");
    return data as GastoRow;
  }, []);

  const actualizar = useCallback(async (id: string, input: GastoInput) => {
    const r = await fetch(`/api/gastos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data?.error ?? "No se pudo actualizar el gasto.");
    return data as GastoRow;
  }, []);

  const eliminar = useCallback(async (id: string) => {
    const r = await fetch(`/api/gastos/${id}`, { method: "DELETE" });
    const data = await r.json();
    if (!r.ok) throw new Error(data?.error ?? "No se pudo eliminar el gasto.");
  }, []);

  return {
    filtros,
    setFiltros,
    lista,
    paginacion,
    resumen,
    catalogo,
    clientes,
    asuntos,
    cargando,
    error,
    puedeEditar,
    recargar,
    crear,
    actualizar,
    eliminar,
  };
}
