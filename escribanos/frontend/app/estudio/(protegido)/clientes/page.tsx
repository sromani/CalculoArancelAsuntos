import Link from "next/link";
import { Suspense } from "react";
import { PanelBusquedaClientes } from "@/components/panel-busqueda-clientes";
import { estudioTw } from "@/lib/estudio-tw";
import { cn } from "@/lib/cn";

export default function ClientesPage() {
  return (
    <div className="flex w-full min-w-0 flex-col gap-4 text-left sm:gap-5">
      <div className="flex w-full shrink-0 justify-end">
        <Link
          href="/estudio/clientes/nuevo"
          className={cn(estudioTw.btnPrimary, "min-w-[12.5rem] justify-center px-8 sm:min-w-[14rem] sm:px-10")}
        >
          Nuevo cliente
        </Link>
      </div>
      <Suspense fallback={<p className={estudioTw.bodySm}>Cargando…</p>}>
        <PanelBusquedaClientes />
      </Suspense>
    </div>
  );
}
