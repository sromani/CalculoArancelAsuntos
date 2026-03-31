import Link from "next/link";
import { ListaAsuntos } from "@/components/lista-asuntos";

export default function AsuntosPage() {
  return (
    <section className="min-w-0 space-y-6">
      <div className="card-app rounded-2xl p-5 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--verde-titulo)] md:text-3xl">Asuntos</h1>
            <p className="mt-2 max-w-xl text-base leading-relaxed text-[var(--gris-texto)]">
              Consultá el listado, refiná con filtros y abrí la ficha de cada expediente.
            </p>
          </div>
          <Link
            href="/estudio/asuntos/nuevo"
            className="btn-primary inline-flex min-h-[3rem] w-full shrink-0 items-center justify-center rounded-[10px] border-2 border-transparent px-8 py-3 text-base font-semibold shadow-md shadow-[rgba(0,166,81,0.15)] transition hover:shadow-lg hover:shadow-[rgba(0,166,81,0.2)] sm:w-auto sm:min-w-[12rem]"
          >
            Crear asunto
          </Link>
        </div>
      </div>
      <ListaAsuntos />
    </section>
  );
}
