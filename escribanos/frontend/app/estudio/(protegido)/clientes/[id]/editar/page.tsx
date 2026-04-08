import { FormularioCliente } from "@/components/formulario-cliente";
import { cn } from "@/lib/cn";

type Props = { params: Promise<{ id: string }> };

export default async function EditarClientePage(props: Props) {
  const { id } = await props.params;
  return (
    <div className="flex w-full min-w-0 justify-center">
      <div
        className={cn(
          "w-full max-w-lg sm:max-w-2xl md:max-w-3xl lg:max-w-4xl",
          "rounded-3xl border border-gray-200/80 bg-white/90 p-6 shadow-[0_25px_60px_-28px_rgba(15,23,42,0.2)] backdrop-blur-md",
          "sm:p-8 lg:p-10",
        )}
      >
        <FormularioCliente clienteId={id} />
      </div>
    </div>
  );
}
