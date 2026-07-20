"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { EditorPresupuesto } from "@/components/presupuestos/editor-presupuesto";
import { usePresupuestos } from "@/components/presupuestos/use-presupuestos";
import type { PresupuestoRow } from "@/lib/presupuestos/types";

export default function PaginaPresupuestoDetalle() {
  const params = useParams();
  const id = params.id as string;
  const { actualizar } = usePresupuestos();
  const [presupuesto, setPresupuesto] = useState<PresupuestoRow | null>(null);
  const [clientes, setClientes] = useState<{ id: string; nombre: string }[]>([]);
  const [asuntos, setAsuntos] = useState<{ id: string; ordinal: number; descripcion: string | null; clienteId: string }[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      const [rP, rC, rA] = await Promise.all([
        fetch(`/api/presupuestos/${id}`),
        fetch("/api/clientes"),
        fetch("/api/asuntos"),
      ]);
      const p = await rP.json();
      const c = await rC.json();
      const a = await rA.json();
      if (!rP.ok) setError(p?.error ?? "No encontrado");
      else setPresupuesto(p as PresupuestoRow);
      if (rC.ok) setClientes(c);
      if (rA.ok) setAsuntos(a);
    })();
  }, [id]);

  if (error) return <p className="text-center text-rose-700 py-12">{error}</p>;
  if (!presupuesto) return <p className="text-center py-12">Cargando presupuesto…</p>;

  return (
    <EditorPresupuesto
      presupuesto={presupuesto}
      clientes={clientes}
      asuntos={asuntos}
      onGuardar={(payload) => actualizar(id, payload as Parameters<typeof actualizar>[1])}
    />
  );
}
