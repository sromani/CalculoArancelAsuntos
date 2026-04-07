import Link from "next/link";

export default function HomePage() {
  return (
    <section className="space-y-6">
      <div className="card-app rounded-2xl p-5 sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--verde-titulo)] sm:text-3xl md:text-4xl">
          Sistema de gestión
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-[var(--gris-texto)]">
          Clientes, asuntos notariales y legales, y seguimiento.
        </p>
        <div className="mt-14 flex flex-col gap-3 sm:mt-16 sm:flex-row sm:flex-wrap sm:items-stretch">
          <Link
            className="btn-primary inline-flex min-h-[3rem] w-full items-center justify-center rounded-[10px] border-2 border-transparent px-8 py-3 text-base font-semibold shadow-md shadow-[rgba(0,166,81,0.15)] transition hover:shadow-lg hover:shadow-[rgba(0,166,81,0.2)] sm:w-auto sm:min-w-[11rem]"
            href="/estudio/clientes"
          >
            Clientes
          </Link>
          <Link
            className="btn-secondary box-border inline-flex min-h-[3rem] w-full items-center justify-center rounded-[10px] border-2 px-8 py-3 text-base font-semibold sm:w-auto sm:min-w-[11rem]"
            href="/estudio/asuntos"
          >
            Asuntos
          </Link>
        </div>
      </div>
    </section>
  );
}
