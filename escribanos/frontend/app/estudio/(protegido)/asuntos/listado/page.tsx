import Link from "next/link";
import { ListaAsuntos } from "@/components/lista-asuntos";

export default function ListadoAsuntosPage() {
  return (
    <div className="estudio-ac-legacy estudio-listado-ancho flex w-full min-w-0 flex-col gap-4 text-left sm:gap-5">
      <p className="muted mt-0">
        <Link href="/estudio/asuntos">← Asuntos</Link>
      </p>
      <ListaAsuntos />
    </div>
  );
}
