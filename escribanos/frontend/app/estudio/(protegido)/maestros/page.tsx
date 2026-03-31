import { PanelMaestros } from "@/components/panel-maestros";

export default function MaestrosPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--verde-titulo)] md:text-3xl">Socios y Equipo</h1>
        <p className="mt-1 break-words text-sm text-[var(--gris-texto)]">
          Dos altas: <strong>socio</strong> (rol fijo) y <strong>equipo</strong> (rol único que define el área).
          Nombre obligatorio en ambos; profesión y función opcionales donde corresponda. Solo administradores y
          socios.
        </p>
      </div>
      <PanelMaestros />
    </section>
  );
}
