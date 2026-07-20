import { NextResponse } from "next/server";
import { requiereApiSesion } from "@/lib/api-auth";
import { mensajeErrorApiDbAcceso, obtenerErrorConfiguracionDb } from "@/lib/api-db";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  presupuestoInclude,
  serializarPresupuesto,
  validarPresupuestoInput,
} from "@/lib/presupuestos/validaciones";
import { esSoloLectura, puedeGestionarGastos } from "@/lib/roles-app";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const auth = await requiereApiSesion();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const p = await prisma.presupuestoNotarial.findUnique({
      where: { id },
      include: presupuestoInclude,
    });
    if (!p) {
      return NextResponse.json({ error: "Presupuesto no encontrado." }, { status: 404 });
    }
    return NextResponse.json(serializarPresupuesto(p));
  } catch (e) {
    return NextResponse.json({ error: mensajeErrorApiDbAcceso(e) }, { status: 503 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requiereApiSesion();
  if (!auth.ok) return auth.response;

  if (esSoloLectura(auth.sesion.rol) || !puedeGestionarGastos(auth.sesion.rol)) {
    return NextResponse.json({ error: "No tenés permiso." }, { status: 403 });
  }

  const { id } = await params;
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
  const gastoIds = data.gastoIds;

  try {
    if (gastoIds) {
      await prisma.presupuestoGastoLinea.deleteMany({ where: { presupuestoId: id } });
      const gastos = await prisma.gasto.findMany({ where: { id: { in: gastoIds } } });
      await prisma.presupuestoGastoLinea.createMany({
        data: gastos.map((g, idx) => ({
          presupuestoId: id,
          gastoId: g.id,
          importe: g.importe,
          moneda: g.moneda,
          incluido: true,
          orden: idx,
        })),
      });
    }

    const actualizado = await prisma.presupuestoNotarial.update({
      where: { id },
      data: {
        asuntoId: data.asuntoId,
        estado: data.estado,
        titulo: data.titulo,
        actoCapituloId: data.actoCapituloId,
        actoPosDoc: data.actoPosDoc,
        actoPosBien: data.actoPosBien,
        actoDescripcion: data.actoDescripcion,
        actoSnapshot: data.actoSnapshot ?? undefined,
        monedaHonorario: data.monedaHonorario,
        honorarioArancel: data.honorarioArancel,
        honorarioACobrar: data.honorarioACobrar,
        fonasaPct: data.fonasaPct,
        irpfPct: data.irpfPct,
        desgloseArancel: data.desgloseArancel ?? undefined,
        desglosePresupuesto: data.desglosePresupuesto ?? undefined,
        totalGastos: typeof body.totalGastos === "number" ? body.totalGastos : undefined,
        totalPresupuesto: typeof body.totalPresupuesto === "number" ? body.totalPresupuesto : undefined,
        fechaCotizacion: data.fechaCotizacion ? new Date(data.fechaCotizacion) : undefined,
        cotizacionesSnapshot: data.cotizacionesSnapshot ?? undefined,
        notas: data.notas,
        historial: {
          create: {
            usuarioId: auth.sesion.sub,
            accion: "ACTUALIZAR",
            detalle: { campos: Object.keys(body) },
          },
        },
      },
      include: presupuestoInclude,
    });

    await registrarAuditoria({
      usuarioId: auth.sesion.sub,
      accion: "PRESUPUESTO_ACTUALIZAR",
      entidad: "PresupuestoNotarial",
      entidadId: id,
    });

    return NextResponse.json(serializarPresupuesto(actualizado));
  } catch (e) {
    return NextResponse.json({ error: mensajeErrorApiDbAcceso(e) }, { status: 503 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await requiereApiSesion();
  if (!auth.ok) return auth.response;

  if (esSoloLectura(auth.sesion.rol) || !puedeGestionarGastos(auth.sesion.rol)) {
    return NextResponse.json({ error: "No tenés permiso." }, { status: 403 });
  }

  const { id } = await params;

  try {
    await prisma.presupuestoNotarial.delete({ where: { id } });
    await registrarAuditoria({
      usuarioId: auth.sesion.sub,
      accion: "PRESUPUESTO_ELIMINAR",
      entidad: "PresupuestoNotarial",
      entidadId: id,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: mensajeErrorApiDbAcceso(e) }, { status: 503 });
  }
}
