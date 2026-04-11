import { ListaAsuntos } from "@/components/lista-asuntos";

export default function AsuntosPage() {
  return (
    <div className="estudio-ac-legacy flex w-full min-w-0 flex-col gap-4 text-left sm:gap-5">
      <ListaAsuntos />
    </div>
  );
}
