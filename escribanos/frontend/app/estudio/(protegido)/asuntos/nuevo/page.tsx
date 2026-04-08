import Link from "next/link";
import { FormularioAsunto } from "@/components/formulario-asunto";
import { EstudioPageHeader } from "@/components/estudio-page-header";
import { estudioLinkBack } from "@/lib/estudio-estilos";
import { estudioTw } from "@/lib/estudio-tw";
import { cn } from "@/lib/cn";

export default function AsuntoNuevoPage() {
  return (
    <div className={cn("max-w-4xl min-w-0 w-full", estudioTw.stack)}>
      <div className="w-full text-left">
        <Link href="/estudio/asuntos" className={estudioLinkBack}>
          <span aria-hidden>←</span> Volver al listado
        </Link>
      </div>
      <EstudioPageHeader
        eyebrow="Expedientes"
        title="Nuevo asunto"
        description="Asociá un cliente del directorio, elegí el acto del catálogo y definí fechas y alertas."
      />
      <div className="w-full text-left">
        <FormularioAsunto />
      </div>
    </div>
  );
}
