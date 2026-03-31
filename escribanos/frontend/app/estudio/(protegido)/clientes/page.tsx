import { VistaClientes } from "@/components/vista-clientes";

export default function ClientesPage() {
  return (
    <section className="min-w-0 space-y-6">
      <div className="card-app rounded-2xl p-5 sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--verde-titulo)] md:text-3xl">Clientes</h1>
        <p className="mt-2 max-w-2xl text-base leading-relaxed text-[var(--gris-texto)]">
          Alta, búsqueda y baja de personas físicas y jurídicas. Solo se permite eliminar si no tienen
          asuntos asociados ni asuntos en trámite.
        </p>
      </div>
      <VistaClientes />
    </section>
  );
}
