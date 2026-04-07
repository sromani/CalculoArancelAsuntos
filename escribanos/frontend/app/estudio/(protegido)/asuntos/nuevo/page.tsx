import { FormularioAsunto } from "@/components/formulario-asunto";

export default function AsuntoNuevoPage() {
  return (
    <section className="max-w-4xl space-y-10">
      <header>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--verde-titulo)] sm:text-3xl">
          Nuevo Asunto
        </h1>
      </header>
      <FormularioAsunto />
    </section>
  );
}
