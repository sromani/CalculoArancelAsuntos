"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { GastoCompositor } from "@/components/gastos/gasto-compositor";
import { GastosToastProvider, useGastosToast } from "@/components/gastos/gastos-toast";
import type { GastoCatalogoRow, GastoInput } from "@/lib/gastos/types";

function PaginaNuevoGastoInner() {
  const searchParams = useSearchParams();
  const clienteId = searchParams.get("clienteId") ?? undefined;
  const asuntoId = searchParams.get("asuntoId") ?? undefined;
  const { toast } = useGastosToast();

  const [catalogo, setCatalogo] = useState<GastoCatalogoRow[]>([]);
  const [clientes, setClientes] = useState<{ id: string; nombre: string; documento: string }[]>([]);
  const [asuntos, setAsuntos] = useState<
    { id: string; ordinal: number; descripcion: string | null; clienteId: string }[]
  >([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    void (async () => {
      const [rC, rA, rCat] = await Promise.all([
        fetch("/api/clientes"),
        fetch("/api/asuntos"),
        fetch("/api/gastos/catalogo"),
      ]);
      const c = await rC.json();
      const a = await rA.json();
      const cat = await rCat.json();
      if (rC.ok) setClientes(c);
      if (rA.ok) setAsuntos(a);
      if (rCat.ok) setCatalogo(cat);
      setCargando(false);
    })();
  }, []);

  async function guardarVarios(inputs: GastoInput[]) {
    for (const input of inputs) {
      const r = await fetch("/api/gastos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error ?? "No se pudo crear el gasto.");
    }
    toast(
      inputs.length === 1 ? "Gasto registrado." : `${inputs.length} gastos registrados.`,
      "ok",
    );
  }

  if (cargando) {
    return <p className="py-16 text-center text-sm text-neutral-500">Cargando formulario…</p>;
  }

  return (
    <GastoCompositor
      catalogo={catalogo}
      clientes={clientes}
      asuntos={asuntos}
      initialClienteId={clienteId}
      initialAsuntoId={asuntoId}
      onGuardarVarios={guardarVarios}
    />
  );
}

export default function PaginaNuevoGasto() {
  return (
    <GastosToastProvider>
      <PaginaNuevoGastoInner />
    </GastosToastProvider>
  );
}
