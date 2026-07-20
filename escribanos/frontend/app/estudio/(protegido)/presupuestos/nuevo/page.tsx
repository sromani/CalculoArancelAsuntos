"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { EditorPresupuesto } from "@/components/presupuestos/editor-presupuesto";
import { usePresupuestos } from "@/components/presupuestos/use-presupuestos";

export default function PaginaNuevoPresupuesto() {
  const searchParams = useSearchParams();
  const clienteIdInicial = searchParams.get("clienteId") ?? undefined;
  const asuntoIdInicial = searchParams.get("asuntoId") ?? undefined;
  const { crear } = usePresupuestos();
  const [clientes, setClientes] = useState<{ id: string; nombre: string }[]>([]);
  const [asuntos, setAsuntos] = useState<{ id: string; ordinal: number; descripcion: string | null; clienteId: string }[]>([]);

  useEffect(() => {
    void (async () => {
      const [rC, rA] = await Promise.all([fetch("/api/clientes"), fetch("/api/asuntos")]);
      const c = await rC.json();
      const a = await rA.json();
      if (rC.ok) setClientes(c);
      if (rA.ok) setAsuntos(a);
    })();
  }, []);

  return (
    <EditorPresupuesto
      initialClienteId={clienteIdInicial}
      initialAsuntoId={asuntoIdInicial}
      clientes={clientes}
      asuntos={asuntos}
      onGuardar={(payload) => crear(payload as Parameters<typeof crear>[0])}
    />
  );
}
