import Link from "next/link";
import { FormularioAsunto } from "@/components/formulario-asunto";

export default function AsuntoNuevoPage() {
  return (
    <div className="estudio-ac-legacy w-full min-w-0 max-w-4xl text-left">
      <div className="panel-alta">
        <p className="muted mt-0">
          <Link href="/estudio/asuntos">← Asuntos</Link>
        </p>
        <h1 className="page-title">Alta de asunto</h1>
        <p className="muted mb-4 max-w-2xl text-sm">
          Asociá un cliente del directorio, elegí el acto del catálogo y definí fechas y alertas.
        </p>
        <FormularioAsunto legacyAlta />
      </div>
    </div>
  );
}
