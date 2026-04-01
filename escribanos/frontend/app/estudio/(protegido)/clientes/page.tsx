import { VistaClientes } from "@/components/vista-clientes";

export default function ClientesPage() {
  return (
    <section className="min-w-0 max-w-6xl space-y-12">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--verde-titulo)] sm:text-3xl">Clientes</h1>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-neutral-600">
          Personas físicas y jurídicas. Solo podés eliminar si no tienen asuntos vinculados.
        </p>
      </header>
      <VistaClientes />
    </section>
  );
}
