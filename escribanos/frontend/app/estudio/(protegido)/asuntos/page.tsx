import ModuloHub from "@/app/components/ModuloHub";

export default function AsuntosPage() {
  return (
    <ModuloHub
      titulo="Asuntos"
      subtitulo="Listado y altas del estudio"
      acciones={[
        {
          href: "/estudio/asuntos/listado",
          titulo: "Listado de Asuntos",
          descripcion: "Buscá por filtros o mirá el listado general, y abrí la ficha de cada asunto.",
        },
        {
          href: "/estudio/asuntos/nuevo",
          titulo: "Nuevo Asunto",
          descripcion: "Asociá un cliente, elegí tipo y asunto del catálogo, y opcionalmente una alerta.",
        },
      ]}
    />
  );
}
