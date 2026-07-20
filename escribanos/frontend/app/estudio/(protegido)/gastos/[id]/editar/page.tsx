"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { GastoFormPagina } from "@/components/gastos/gasto-form-pagina";
import { GastosToastProvider, useGastosToast } from "@/components/gastos/gastos-toast";
import type { GastoInput, GastoRow } from "@/lib/gastos/types";

function PaginaEditarGastoInner() {
  const params = useParams();
  const id = params.id as string;
  const { toast } = useGastosToast();

  const [gasto, setGasto] = useState<GastoRow | null>(null);
  const [clientes, setClientes] = useState<{ id: string; nombre: string; documento: string }[]>([]);
  const [asuntos, setAsuntos] = useState<
    { id: string; ordinal: number; descripcion: string | null; clienteId: string }[]
  >([]);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    void (async () => {
      const [rG, rC, rA] = await Promise.all([
        fetch(`/api/gastos/${id}`),
        fetch("/api/clientes"),
        fetch("/api/asuntos"),
      ]);
      const g = await rG.json();
      const c = await rC.json();
      const a = await rA.json();
      if (!rG.ok) setError(g?.error ?? "Gasto no encontrado.");
      else setGasto(g as GastoRow);
      if (rC.ok) setClientes(c);
      if (rA.ok) setAsuntos(a);
      setCargando(false);
    })();
  }, [id]);

  async function guardar(input: GastoInput) {
    const r = await fetch(`/api/gastos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data?.error ?? "No se pudo actualizar.");
    toast("Gasto actualizado.", "ok");
  }

  if (cargando) {
    return <p className="py-16 text-center text-sm text-neutral-500">Cargando…</p>;
  }
  if (error || !gasto) {
    return <p className="py-16 text-center text-sm text-rose-700">{error || "No encontrado."}</p>;
  }

  return (
    <GastoFormPagina
      gasto={gasto}
      clientes={clientes}
      asuntos={asuntos}
      onGuardar={guardar}
    />
  );
}

export default function PaginaEditarGasto() {
  return (
    <GastosToastProvider>
      <PaginaEditarGastoInner />
    </GastosToastProvider>
  );
}
