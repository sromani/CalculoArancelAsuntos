import Link from "next/link";
import { ListaAsuntos } from "@/components/lista-asuntos";
import { estudioTw } from "@/lib/estudio-tw";
import { cn } from "@/lib/cn";

export default function AsuntosPage() {
  return (
    <div className="flex w-full min-w-0 flex-col gap-4 text-left sm:gap-5">
      <div className="flex w-full shrink-0 justify-end">
        <Link
          href="/estudio/asuntos/nuevo"
          className={cn(estudioTw.btnPrimary, "min-w-[12.5rem] justify-center px-8 sm:min-w-[14rem] sm:px-10")}
        >
          Nuevo asunto
        </Link>
      </div>
      <ListaAsuntos />
    </div>
  );
}
