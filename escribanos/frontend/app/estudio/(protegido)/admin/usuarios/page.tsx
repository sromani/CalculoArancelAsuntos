import { AdminUsuariosPanel } from "@/components/admin-usuarios-panel";
import { estudioTw } from "@/lib/estudio-tw";
import { cn } from "@/lib/cn";

export default function AdminUsuariosPage() {
  return (
    <section className={cn("min-w-0 w-full", estudioTw.stack)}>
      <div className="mx-auto max-w-2xl space-y-3 text-center">
        <h1 className={estudioTw.h1}>Administración de usuarios</h1>
        <p className={cn(estudioTw.body, "text-justify")}>
          Alta de usuarios, roles y estado. Solo accesible con rol administrador.
        </p>
      </div>
      <AdminUsuariosPanel />
    </section>
  );
}
