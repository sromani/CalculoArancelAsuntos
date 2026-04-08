import { redirect } from "next/navigation";

/** Ya no hay panel unificado: entrar al módulo por las pestañas del sitio (Clientes / Asuntos). */
export default function EstudioRootPage() {
  redirect("/estudio/clientes");
}
