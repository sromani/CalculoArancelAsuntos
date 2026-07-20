import { NextResponse } from "next/server";
import { requiereApiSesion } from "@/lib/api-auth";
import { mensajeErrorApiDbAcceso, obtenerErrorConfiguracionDb } from "@/lib/api-db";
import { asegurarCatalogoGastos } from "@/lib/gastos/catalogo-seed";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requiereApiSesion();
  if (!auth.ok) return auth.response;

  const errorConfiguracion = obtenerErrorConfiguracionDb();
  if (errorConfiguracion) {
    return NextResponse.json({ error: errorConfiguracion }, { status: 503 });
  }

  try {
    await asegurarCatalogoGastos(prisma);
    const items = await prisma.gastoCatalogoItem.findMany({
      where: { activo: true },
      orderBy: [{ orden: "asc" }, { nombre: "asc" }],
    });
    return NextResponse.json(
      items.map((i) => ({
        id: i.id,
        nombre: i.nombre,
        categoria: i.categoria,
        oficinaPublica: i.oficinaPublica,
        descripcion: i.descripcion,
        importeSugerido: i.importeSugerido,
        moneda: i.moneda,
        activo: i.activo,
        orden: i.orden,
      }))
    );
  } catch (e) {
    return NextResponse.json({ error: mensajeErrorApiDbAcceso(e) }, { status: 503 });
  }
}
