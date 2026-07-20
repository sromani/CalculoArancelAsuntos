import { PanelGastos } from "@/components/gastos/panel-gastos";

type Props = { searchParams: Promise<{ asuntoId?: string; clienteId?: string }> };

export default async function PaginaGastos({ searchParams }: Props) {
  const sp = await searchParams;
  return (
    <PanelGastos
      initialFiltros={{
        asuntoId: sp.asuntoId,
        clienteId: sp.clienteId,
      }}
    />
  );
}
