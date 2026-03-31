import Link from "next/link";
import { FormularioAsunto } from "@/components/formulario-asunto";

export default function AsuntoNuevoPage() {
  return (
    <section className="space-y-4">
      <div>
        <p className="text-sm text-[var(--gris-texto)]">
          <Link href="/estudio/asuntos" className="font-medium text-[var(--verde-principal)] underline">
            Asuntos
          </Link>{" "}
          / Nuevo
        </p>
        <h1 className="mt-1 text-xl font-bold text-[var(--verde-titulo)] sm:text-2xl md:text-3xl">Alta de asunto</h1>
        <p className="mt-1 text-sm text-[var(--gris-texto)]">
          Tras crear se abre la ficha del asunto con seguimiento y acciones permitidas por rol.
        </p>
      </div>
      <FormularioAsunto />
    </section>
  );
}
