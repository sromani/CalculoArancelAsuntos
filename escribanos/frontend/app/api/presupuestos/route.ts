import { NextResponse } from "next/server";
import { requiereApiSesion } from "@/lib/api-auth";
import { mensajeErrorApiDbAcceso, obtenerErrorConfiguracionDb } from "@/lib/api-db";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  construirWherePresupuestos,
  presupuestoInclude,
  serializarPresupuesto,
  validarPresupuestoInput,
} from "@/lib/presupuestos/validaciones";
import { puedeGestionarGastos } from "@/lib/roles-app";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const auth = await requiereApiSesion();
  if (!auth.ok) return auth.response;

  const errorConfiguracion = obtenerErrorConfiguracionDb();
  if (errorConfiguracion) {
    return NextResponse.json({ error: errorConfiguracion }, { status: 503 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const where = construirWherePresupuestos(searchParams);
    const items = await prisma.presupuestoNotarial.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      take: 200,
      include: presupuestoInclude,
    });
    return NextResponse.json(items.map(serializarPresupuesto));
  } catch (e) {
    return NextResponse.json({ error: mensajeErrorApiDbAcceso(e) }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const auth = await requiereApiSesion();
  if (!auth.ok) return auth.response;

  if (!puedeGestionarGastos(auth.sesion.rol)) {
    return NextResponse.json({ error: "No tenés permiso para crear presupuestos." }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON inválido." }, { status: 400 });
  }

  const validado = validarPresupuestoInput(body);
  if (!validado.ok) {
    return NextResponse.json({ error: validado.error }, { status: 400 });
  }

  const { data } = validado;

  try {
    const cliente = await prisma.cliente.findUnique({ where: { id: data.clienteId } });
    if (!cliente) {
      return NextResponse.json({ error: "Cliente no encontrado." }, { status: 400 });
    }

    const gastoIds = data.gastoIds ?? [];
    const gastos =
      gastoIds.length > 0
        ? await prisma.gasto.findMany({ where: { id: { in: gastoIds } } })
        : [];

    const creado = await prisma.presupuestoNotarial.create({
      data: {
        clienteId: data.clienteId,
        asuntoId: data.asuntoId,
        estado: data.estado ?? "BORRADOR",
        titulo: data.titulo,
        actoCapituloId: data.actoCapituloId,
        actoPosDoc: data.actoPosDoc,
        actoPosBien: data.actoPosBien,
        actoDescripcion: data.actoDescripcion,
        actoSnapshot: data.actoSnapshot ?? undefined,
        monedaHonorario: data.monedaHonorario ?? "UYU",
        honorarioArancel: data.honorarioArancel ?? 0,
        honorarioACobrar: data.honorarioACobrar ?? 0,
        fonasaPct: data.fonasaPct ?? 6,
        irpfPct: data.irpfPct ?? 15,
        desgloseArancel: data.desgloseArancel ?? undefined,
        desglosePresupuesto: data.desglosePresupuesto ?? undefined,
        totalGastos: data.desglosePresupuesto ? (body.totalGastos as number) ?? 0 : 0,
        totalPresupuesto: data.desglosePresupuesto ? (body.totalPresupuesto as number) ?? 0 : 0,
        fechaCotizacion: data.fechaCotizacion ? new Date(data.fechaCotizacion) : null,
        cotizacionesSnapshot: data.cotizacionesSnapshot ?? undefined,
        notas: data.notas,
        createdById: auth.sesion.sub,
        lineasGastos: {
          create: gastos.map((g, idx) => ({
            gastoId: g.id,
            importe: g.importe,
            moneda: g.moneda,
            incluido: true,
            orden: idx,
          })),
        },
        historial: {
          create: {
            usuarioId: auth.sesion.sub,
            accion: "CREAR",
            detalle: { estado: data.estado ?? "BORRADOR" },
          },
        },
      },
      include: presupuestoInclude,
    });

    await registrarAuditoria({
      usuarioId: auth.sesion.sub,
      accion: "PRESUPUESTO_CREAR",
      entidad: "PresupuestoNotarial",
      entidadId: creado.id,
    });

    return NextResponse.json(serializarPresupuesto(creado), { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: mensajeErrorApiDbAcceso(e) }, { status: 503 });
  }
}
