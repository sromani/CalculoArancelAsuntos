import Link from "next/link";
import { FormularioCliente } from "@/components/formulario-cliente";

type Props = { params: Promise<{ id: string }> };

export default async function EditarClientePage(props: Props) {
  const { id } = await props.params;
  return (
    <div className="estudio-ac-legacy w-full min-w-0 text-left">
      <div className="panel-alta">
        <p className="muted mt-0">
          <Link href="/estudio/clientes/directorio">← Directorio de Clientes</Link>
        </p>
        <h1 className="page-title">Editar cliente</h1>
        <FormularioCliente clienteId={id} legacyLayout />
      </div>
    </div>
  );
}
