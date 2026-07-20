import { NextResponse } from "next/server";
import { requiereApiSesion } from "@/lib/api-auth";
import { mensajeErrorApiDbAcceso } from "@/lib/api-db";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const auth = await requiereApiSesion();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const items = await prisma.presupuestoHistorial.findMany({
      where: { presupuestoId: id },
      orderBy: { createdAt: "desc" },
      include: { usuario: { select: { id: true, nombre: true } } },
    });
    return NextResponse.json(
      items.map((h) => ({
        id: h.id,
        accion: h.accion,
        detalle: h.detalle,
        createdAt: h.createdAt.toISOString(),
        usuario: h.usuario,
      }))
    );
  } catch (e) {
    return NextResponse.json({ error: mensajeErrorApiDbAcceso(e) }, { status: 503 });
  }
}
