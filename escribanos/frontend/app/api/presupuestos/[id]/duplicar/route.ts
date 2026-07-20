import { NextResponse } from "next/server";
import { requiereApiSesion } from "@/lib/api-auth";
import { mensajeErrorApiDbAcceso } from "@/lib/api-db";
import { presupuestoInclude, serializarPresupuesto } from "@/lib/presupuestos/validaciones";
import { puedeGestionarGastos } from "@/lib/roles-app";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const auth = await requiereApiSesion();
  if (!auth.ok) return auth.response;

  if (!puedeGestionarGastos(auth.sesion.rol)) {
    return NextResponse.json({ error: "No tenés permiso." }, { status: 403 });
  }

  const { id } = await params;

  try {
    const origen = await prisma.presupuestoNotarial.findUnique({
      where: { id },
      include: { lineasGastos: true },
    });
    if (!origen) {
      return NextResponse.json({ error: "Presupuesto no encontrado." }, { status: 404 });
    }

    const copia = await prisma.presupuestoNotarial.create({
      data: {
        clienteId: origen.clienteId,
        asuntoId: origen.asuntoId,
        estado: "BORRADOR",
        titulo: origen.titulo ? `${origen.titulo} (copia)` : `Copia #${origen.numero}`,
        actoCapituloId: origen.actoCapituloId,
        actoPosDoc: origen.actoPosDoc,
        actoPosBien: origen.actoPosBien,
        actoDescripcion: origen.actoDescripcion,
        actoSnapshot: origen.actoSnapshot ?? undefined,
        monedaHonorario: origen.monedaHonorario,
        honorarioArancel: origen.honorarioArancel,
        honorarioACobrar: origen.honorarioACobrar,
        fonasaPct: origen.fonasaPct,
        irpfPct: origen.irpfPct,
        desgloseArancel: origen.desgloseArancel ?? undefined,
        desglosePresupuesto: origen.desglosePresupuesto ?? undefined,
        totalGastos: origen.totalGastos,
        totalPresupuesto: origen.totalPresupuesto,
        fechaCotizacion: origen.fechaCotizacion,
        cotizacionesSnapshot: origen.cotizacionesSnapshot ?? undefined,
        notas: origen.notas,
        duplicadoDeId: origen.id,
        createdById: auth.sesion.sub,
        lineasGastos: {
          create: origen.lineasGastos.map((l) => ({
            gastoId: l.gastoId,
            importe: l.importe,
            moneda: l.moneda,
            incluido: l.incluido,
            orden: l.orden,
          })),
        },
        historial: {
          create: {
            usuarioId: auth.sesion.sub,
            accion: "DUPLICAR",
            detalle: { origenId: origen.id, origenNumero: origen.numero },
          },
        },
      },
      include: presupuestoInclude,
    });

    return NextResponse.json(serializarPresupuesto(copia), { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: mensajeErrorApiDbAcceso(e) }, { status: 503 });
  }
}
