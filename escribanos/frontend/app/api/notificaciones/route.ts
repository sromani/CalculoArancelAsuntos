import { NextResponse } from "next/server";
import { requiereApiSesion } from "@/lib/api-auth";
import { mensajeErrorApiDbAcceso } from "@/lib/api-db";
import { generarNotificacionesEstudio, serializarNotificacion } from "@/lib/notificaciones/generar";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const auth = await requiereApiSesion();
  if (!auth.ok) return auth.response;

  try {
    await generarNotificacionesEstudio(auth.sesion.sub);

    const { searchParams } = new URL(request.url);
    const soloNoLeidas = searchParams.get("noLeidas") === "1";

    const items = await prisma.notificacion.findMany({
      where: {
        OR: [{ usuarioId: auth.sesion.sub }, { usuarioId: null }],
        ...(soloNoLeidas ? { leida: false } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const noLeidas = await prisma.notificacion.count({
      where: {
        OR: [{ usuarioId: auth.sesion.sub }, { usuarioId: null }],
        leida: false,
      },
    });

    return NextResponse.json({
      items: items.map(serializarNotificacion),
      noLeidas,
    });
  } catch (e) {
    return NextResponse.json({ error: mensajeErrorApiDbAcceso(e) }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  const auth = await requiereApiSesion();
  if (!auth.ok) return auth.response;

  let body: { ids?: string[]; todas?: boolean };
  try {
    body = (await request.json()) as { ids?: string[]; todas?: boolean };
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  try {
    if (body.todas) {
      await prisma.notificacion.updateMany({
        where: {
          OR: [{ usuarioId: auth.sesion.sub }, { usuarioId: null }],
          leida: false,
        },
        data: { leida: true },
      });
    } else if (body.ids?.length) {
      await prisma.notificacion.updateMany({
        where: { id: { in: body.ids } },
        data: { leida: true },
      });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: mensajeErrorApiDbAcceso(e) }, { status: 503 });
  }
}
