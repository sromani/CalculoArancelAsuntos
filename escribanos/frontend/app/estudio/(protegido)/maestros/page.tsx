import { PanelMaestros } from "@/components/panel-maestros";
import { estudioTw } from "@/lib/estudio-tw";
import { cn } from "@/lib/cn";

export default function MaestrosPage() {
  return (
    <section className={cn("min-w-0 w-full", estudioTw.stack)}>
      <div className="mx-auto max-w-3xl space-y-3 text-center">
        <h1 className={estudioTw.h1}>Socios y Equipo</h1>
        <p className={cn(estudioTw.body, "text-justify")}>
          Dos altas: <strong className="font-semibold text-gray-900">socio</strong> (rol fijo) y{" "}
          <strong className="font-semibold text-gray-900">equipo</strong> (rol único que define el área). Nombre
          obligatorio en ambos; profesión y función opcionales donde corresponda. Solo administradores y socios.
        </p>
      </div>
      <PanelMaestros />
    </section>
  );
}
