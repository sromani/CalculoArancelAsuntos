import Link from "next/link";
import { ListaAsuntos } from "@/components/lista-asuntos";

export default function AsuntosPage() {
  return (
    <section className="min-w-0 max-w-7xl space-y-10">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
        <div className="min-w-0 max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-[var(--verde-titulo)] sm:text-[2rem] sm:leading-tight">
            Asuntos
          </h1>
          <p className="mt-3 text-[0.9375rem] leading-relaxed text-neutral-600">
            Gestión integral de expedientes. Filtre, consulte o cree un nuevo asunto.
          </p>
        </div>
        <Link
          href="/estudio/asuntos/nuevo"
          className="btn-primary inline-flex min-h-[2.875rem] w-full shrink-0 items-center justify-center rounded-xl border-2 border-transparent px-7 py-2.5 text-[0.9375rem] font-semibold shadow-md shadow-[rgba(0,166,81,0.18)] transition hover:shadow-lg hover:shadow-[rgba(0,166,81,0.22)] sm:w-auto"
        >
          Nuevo asunto
        </Link>
      </header>
      <ListaAsuntos />
    </section>
  );
}
