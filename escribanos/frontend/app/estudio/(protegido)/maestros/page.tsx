import { EstudioPageHeader } from "@/components/estudio-page-header";
import { PanelMaestros } from "@/components/panel-maestros";
import { estudioTw } from "@/lib/estudio-tw";
import { cn } from "@/lib/cn";

export default function MaestrosPage() {
  return (
    <section className={cn("min-w-0 w-full", estudioTw.stack)}>
      <EstudioPageHeader
        eyebrow="Configuración"
        title="Socios y equipo"
        description="Alta de socios y profesionales del estudio. Solo administradores y socios."
      />
      <PanelMaestros />
    </section>
  );
}
