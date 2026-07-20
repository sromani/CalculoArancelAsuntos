import { redirect } from "next/navigation";

/** Compatibilidad con ruta anterior. */
export default function RedirectGastosNotariales() {
  redirect("/estudio/gastos");
}
