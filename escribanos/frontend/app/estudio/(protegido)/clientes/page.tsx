import ModuloHub from "@/app/components/ModuloHub";

export default function ClientesPage() {
  return (
    <ModuloHub
      titulo="Clientes"
      subtitulo="Directorio y altas del estudio"
      acciones={[
        {
          href: "/estudio/clientes/directorio",
          titulo: "Directorio de Clientes",
          descripcion: "Buscá un cliente en particular o mirá el listado general.",
        },
        {
          href: "/estudio/clientes/nuevo",
          titulo: "Nuevo Cliente",
          descripcion: "Alta de persona física o jurídica con sus datos de identificación.",
        },
      ]}
    />
  );
}
