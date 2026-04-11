import { FichaAsunto } from "@/components/ficha-asunto";

type Props = { params: Promise<{ id: string }> };

export default async function AsuntoFichaPage(props: Props) {
  const { id } = await props.params;
  return (
    <section className="estudio-ac-legacy w-full text-left">
      <div className="mx-auto max-w-4xl">
        <FichaAsunto id={id} />
      </div>
    </section>
  );
}
