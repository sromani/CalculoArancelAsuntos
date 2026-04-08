import { FichaAsunto } from "@/components/ficha-asunto";

type Props = { params: Promise<{ id: string }> };

export default async function AsuntoFichaPage(props: Props) {
  const { id } = await props.params;
  return (
    <section className="w-full text-left">
      <FichaAsunto id={id} />
    </section>
  );
}
