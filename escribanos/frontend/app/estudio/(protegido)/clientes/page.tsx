import { Suspense } from "react";
import { PanelBusquedaClientes } from "@/components/panel-busqueda-clientes";
import { estudioTw } from "@/lib/estudio-tw";

export default function ClientesPage() {
  return (
    <div className="estudio-ac-legacy flex w-full min-w-0 flex-col gap-4 text-left sm:gap-5">
      <Suspense fallback={<p className={estudioTw.bodySm}>Cargando…</p>}>
        <PanelBusquedaClientes />
      </Suspense>
    </div>
  );
}
