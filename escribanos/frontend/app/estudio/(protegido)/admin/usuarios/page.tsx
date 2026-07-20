import { EstudioPageHeader } from "@/components/estudio-page-header";
import { AdminUsuariosPanel } from "@/components/admin-usuarios-panel";
import { estudioTw } from "@/lib/estudio-tw";
import { cn } from "@/lib/cn";

export default function AdminUsuariosPage() {
  return (
    <section className={cn("min-w-0 w-full", estudioTw.stack)}>
      <EstudioPageHeader
        eyebrow="Administración"
        title="Usuarios del estudio"
        description="Alta de usuarios, roles y estado. Solo accesible con rol administrador."
      />
      <AdminUsuariosPanel />
    </section>
  );
}
