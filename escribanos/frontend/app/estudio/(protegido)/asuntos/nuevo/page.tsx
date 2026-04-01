import Link from "next/link";
import { FormularioAsunto } from "@/components/formulario-asunto";

export default function AsuntoNuevoPage() {
  return (
    <section className="max-w-4xl space-y-10">
      <header>
        <p className="text-xs text-neutral-500">
          <Link href="/estudio/asuntos" className="font-medium text-[var(--verde-principal)] hover:underline">
            Asuntos
          </Link>{" "}
          · Nuevo
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--verde-titulo)] sm:text-3xl">Alta de asunto</h1>
        <p className="mt-2 text-sm text-neutral-600">Al guardar se abre la ficha del expediente.</p>
      </header>
      <FormularioAsunto />
    </section>
  );
}
