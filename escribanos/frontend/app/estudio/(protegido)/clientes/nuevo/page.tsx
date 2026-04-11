"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormularioCliente } from "@/components/formulario-cliente";

export default function ClienteNuevoPage() {
  const router = useRouter();

  return (
    <div className="estudio-ac-legacy w-full min-w-0 max-w-4xl text-left">
      <div className="panel-alta">
        <p className="muted mt-0">
          <Link href="/estudio/clientes">← Clientes</Link>
        </p>
        <h1 className="page-title">Alta de cliente</h1>
        <FormularioCliente legacyLayout onClienteCreado={() => router.push("/estudio/clientes")} />
      </div>
    </div>
  );
}
