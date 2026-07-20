import { NextResponse } from "next/server";
import { requiereApiSesion } from "@/lib/api-auth";
import { mensajeErrorApiDbAcceso, obtenerErrorConfiguracionDb } from "@/lib/api-db";
import { registrarAuditoria } from "@/lib/auditoria";
import { asegurarCatalogoGastos } from "@/lib/gastos/catalogo-seed";
import {
  construirWhereGastos,
  gastoInclude,
  parsePaginacion,
} from "@/lib/gastos/query";
import {
  parseFechaGasto,
  serializarGasto,
  validarGastoInput,
} from "@/lib/gastos/validaciones";
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
    await asegurarCatalogoGastos(prisma);

    const { searchParams } = new URL(request.url);
    const where = construirWhereGastos(searchParams);
    const { page, pageSize, skip } = parsePaginacion(searchParams);

    const [total, items] = await Promise.all([
      prisma.gasto.count({ where }),
      prisma.gasto.findMany({
        where,
        orderBy: [{ fecha: "desc" }, { createdAt: "desc" }],
        skip,
        take: pageSize,
        include: gastoInclude,
      }),
    ]);

    return NextResponse.json({
      items: items.map(serializarGasto),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (e) {
    return NextResponse.json({ error: mensajeErrorApiDbAcceso(e) }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const auth = await requiereApiSesion();
  if (!auth.ok) return auth.response;

  if (!puedeGestionarGastos(auth.sesion.rol)) {
    return NextResponse.json({ error: "No tenés permiso para crear gastos." }, { status: 403 });
  }

  const errorConfiguracion = obtenerErrorConfiguracionDb();
  if (errorConfiguracion) {
    return NextResponse.json({ error: errorConfiguracion }, { status: 503 });
  }

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
    if (data.clienteId) {
      const cliente = await prisma.cliente.findUnique({ where: { id: data.clienteId } });
      if (!cliente) {
        return NextResponse.json({ error: "Cliente no encontrado." }, { status: 400 });
      }
    }
    if (data.asuntoId) {
      const asunto = await prisma.asunto.findUnique({ where: { id: data.asuntoId } });
      if (!asunto) {
        return NextResponse.json({ error: "Asunto no encontrado." }, { status: 400 });
      }
    }

    const creado = await prisma.gasto.create({
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
      accion: "GASTO_CREAR",
      entidad: "Gasto",
      entidadId: creado.id,
      detalle: { importe: creado.importe, nombre: creado.nombre },
    });

    return NextResponse.json(serializarGasto(creado), { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: mensajeErrorApiDbAcceso(e) }, { status: 503 });
  }
}
