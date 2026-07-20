import { NextResponse } from "next/server";
import { requiereApiSesion } from "@/lib/api-auth";
import { mensajeErrorApiDbAcceso, obtenerErrorConfiguracionDb } from "@/lib/api-db";
import { registrarAuditoria } from "@/lib/auditoria";
import { gastoInclude } from "@/lib/gastos/query";
import {
  parseFechaGasto,
  serializarGasto,
  validarGastoInput,
} from "@/lib/gastos/validaciones";
import { esSoloLectura, puedeGestionarGastos } from "@/lib/roles-app";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const auth = await requiereApiSesion();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const errorConfiguracion = obtenerErrorConfiguracionDb();
  if (errorConfiguracion) {
    return NextResponse.json({ error: errorConfiguracion }, { status: 503 });
  }

  try {
    const gasto = await prisma.gasto.findUnique({ where: { id }, include: gastoInclude });
    if (!gasto) {
      return NextResponse.json({ error: "Gasto no encontrado." }, { status: 404 });
    }
    return NextResponse.json(serializarGasto(gasto));
  } catch (e) {
    return NextResponse.json({ error: mensajeErrorApiDbAcceso(e) }, { status: 503 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requiereApiSesion();
  if (!auth.ok) return auth.response;

  if (esSoloLectura(auth.sesion.rol) || !puedeGestionarGastos(auth.sesion.rol)) {
    return NextResponse.json({ error: "No tenés permiso para editar gastos." }, { status: 403 });
  }

  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON inválido." }, { status: 400 });
  }

  const validado = validarGastoInput(body);
  if (!validado.ok) {
    return NextResponse.json({ error: validado.error }, { status: 400 });
  }

  const { data } = validado;
  const fecha = parseFechaGasto(data.fecha)!;
  const fechaVencimiento = data.fechaVencimiento
    ? parseFechaGasto(data.fechaVencimiento)
    : null;

  try {
    const actualizado = await prisma.gasto.update({
      where: { id },
      data: {
        nombre: data.nombre,
        categoria: data.categoria,
        oficinaPublica: data.oficinaPublica,
        descripcion: data.descripcion,
        fecha,
        fechaVencimiento,
        importe: data.importe,
        moneda: data.moneda,
        estado: data.estado ?? "PENDIENTE",
        observaciones: data.observaciones,
        catalogoItemId: data.catalogoItemId,
        clienteId: data.clienteId,
        asuntoId: data.asuntoId,
      },
      include: gastoInclude,
    });

    await registrarAuditoria({
      usuarioId: auth.sesion.sub,
      accion: "GASTO_ACTUALIZAR",
      entidad: "Gasto",
      entidadId: id,
    });

    return NextResponse.json(serializarGasto(actualizado));
  } catch (e) {
    return NextResponse.json({ error: mensajeErrorApiDbAcceso(e) }, { status: 503 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await requiereApiSesion();
  if (!auth.ok) return auth.response;

  if (esSoloLectura(auth.sesion.rol) || !puedeGestionarGastos(auth.sesion.rol)) {
    return NextResponse.json({ error: "No tenés permiso para eliminar gastos." }, { status: 403 });
  }

  const { id } = await params;

  try {
    await prisma.gasto.delete({ where: { id } });
    await registrarAuditoria({
      usuarioId: auth.sesion.sub,
      accion: "GASTO_ELIMINAR",
      entidad: "Gasto",
      entidadId: id,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: mensajeErrorApiDbAcceso(e) }, { status: 503 });
  }
}
