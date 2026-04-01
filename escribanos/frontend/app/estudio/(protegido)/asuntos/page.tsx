import Link from "next/link";
import { ListaAsuntos } from "@/components/lista-asuntos";

export default function AsuntosPage() {
  return (
    <section className="min-w-0 max-w-6xl space-y-12">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--verde-titulo)] sm:text-3xl">
            Asuntos
          </h1>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-neutral-600">
            Expedientes del estudio. Filtrá, abrí la ficha o creá uno nuevo.
          </p>
        </div>
        <Link
          href="/estudio/asuntos/nuevo"
          className="btn-primary inline-flex min-h-[3rem] w-full shrink-0 items-center justify-center rounded-[10px] border-2 border-transparent px-8 py-3 text-base font-semibold shadow-md shadow-[rgba(0,166,81,0.15)] transition hover:shadow-lg hover:shadow-[rgba(0,166,81,0.2)] sm:w-auto sm:min-w-[12rem]"
        >
          Nuevo asunto
        </Link>
      </header>
      <ListaAsuntos />
    </section>
  );
}
