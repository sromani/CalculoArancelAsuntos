"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormularioCliente } from "@/components/formulario-cliente";
import { estudioLinkBack } from "@/lib/estudio-estilos";
import { estudioTw } from "@/lib/estudio-tw";
import { cn } from "@/lib/cn";

export default function ClienteNuevoPage() {
  const router = useRouter();

  return (
    <div className={cn("w-full min-w-0 max-w-4xl", estudioTw.stack)}>
      <div className="w-full text-left">
        <Link href="/estudio/clientes" className={estudioLinkBack}>
          <span aria-hidden>←</span> Volver al listado
        </Link>
      </div>
      <h1 className={cn(estudioTw.h1, "text-left")}>Nuevo cliente</h1>
      <div className="w-full text-left">
        <FormularioCliente onClienteCreado={() => router.push("/estudio/clientes")} />
      </div>
    </div>
  );
}
