import { Suspense } from "react";
import Link from "next/link";
import { PanelBusquedaClientes } from "@/components/panel-busqueda-clientes";
import { estudioTw } from "@/lib/estudio-tw";

export default function DirectorioClientesPage() {
  return (
    <div className="estudio-ac-legacy estudio-listado-ancho flex w-full min-w-0 flex-col gap-4 text-left sm:gap-5">
      <p className="muted mt-0">
        <Link href="/estudio/clientes">← Clientes</Link>
      </p>
      <Suspense fallback={<p className={estudioTw.bodySm}>Cargando…</p>}>
        <PanelBusquedaClientes />
      </Suspense>
    </div>
  );
}
