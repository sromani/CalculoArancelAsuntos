import { EstadoAsunto, Prisma, TipoAsunto } from "@prisma/client";
import { NextResponse } from "next/server";
import { requiereApiSesion } from "@/lib/api-auth";
import { registrarAuditoria } from "@/lib/auditoria";
import { mensajeErrorValidacionEquipoAsunto } from "@/lib/asunto-equipo-validar";
import {
  esPrismaValidacion,
  mensajeErrorApiDbAcceso,
  obtenerErrorConfiguracionDb,
} from "@/lib/api-db";
import { prisma } from "@/lib/prisma";

const TIPOS: TipoAsunto[] = [TipoAsunto.TODOS, TipoAsunto.NOTARIAL, TipoAsunto.LEGAL];

function parseFechaIso(s: unknown): Date | null {
  if (s === undefined || s === null || s === "") {
    return null;
  }
  const raw = String(s).trim();
  const isoSoloFecha = /^\d{4}-\d{2}-\d{2}$/.test(raw);
  const d = isoSoloFecha ? new Date(`${raw}T00:00:00`) : new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Listado RF-07 (basico): filtros por querystring */
export async function GET(request: Request) {
  const auth = await requiereApiSesion();
  if (!auth.ok) {
    return auth.response;
  }

  const errorConfiguracion = obtenerErrorConfiguracionDb();
  if (errorConfiguracion) {
    return NextResponse.json({ error: errorConfiguracion }, { status: 503 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const estadoQ = searchParams.get("estado");
    const tipoQ = searchParams.get("tipo");
    const profesionalQ = (searchParams.get("profesionalACargoId") ?? "").trim();
    const socioQ = (searchParams.get("socioReferenteId") ?? "").trim();
    const anioInicioQ = Number(searchParams.get("anioInicio") ?? "");
    const inicioDesdeQ = parseFechaIso(searchParams.get("fechaInicioDesde"));
    const inicioHastaQ = parseFechaIso(searchParams.get("fechaInicioHasta"));
    const finDesdeQ = parseFechaIso(searchParams.get("fechaFinalizacionDesde"));
    const finHastaQ = parseFechaIso(searchParams.get("fechaFinalizacionHasta"));
    const q = (searchParams.get("q") ?? "").trim();
    const sinColaborador = searchParams.get("sinColaborador") === "1";
    const sinEquipo = searchParams.get("sinEquipo") === "1";
    const sinContador = searchParams.get("sinContador") === "1";

    const where: Prisma.AsuntoWhereInput = {};

    if (estadoQ === "EN_TRAMITE" || estadoQ === "FINALIZADO") {
      where.estado = estadoQ as EstadoAsunto;
    }

    if (tipoQ === "TODOS" || tipoQ === "NOTARIAL" || tipoQ === "LEGAL") {
      where.tipo = tipoQ as TipoAsunto;
    }

    if (profesionalQ) {
      where.profesionalACargoId = profesionalQ;
    }

    if (socioQ) {
      where.socioReferenteId = socioQ;
    }

    const andFiltros: Prisma.AsuntoWhereInput[] = [];

    if (sinColaborador || sinEquipo) {
      andFiltros.push({ colaboradorACargoId: null });
      andFiltros.push({ colaboradorACargo2Id: null });
    }
    if (sinContador) {
      andFiltros.push({ contadorReferenteId: null });
    }

    if (Number.isInteger(anioInicioQ) && anioInicioQ >= 1900 && anioInicioQ <= 3000) {
      andFiltros.push({
        fechaInicio: {
          gte: new Date(`${anioInicioQ}-01-01T00:00:00`),
          lt: new Date(`${anioInicioQ + 1}-01-01T00:00:00`),
        },
      });
    }
    if (inicioDesdeQ || inicioHastaQ) {
      andFiltros.push({
        fechaInicio: {
          ...(inicioDesdeQ ? { gte: inicioDesdeQ } : {}),
          ...(inicioHastaQ ? { lte: inicioHastaQ } : {}),
        },
      });
    }
    if (finDesdeQ || finHastaQ) {
      andFiltros.push({
        fechaFinalizacion: {
          ...(finDesdeQ ? { gte: finDesdeQ } : {}),
          ...(finHastaQ ? { lte: finHastaQ } : {}),
        },
      });
    }
    if (andFiltros.length > 0) {
      where.AND = andFiltros;
    }

    if (q) {
      where.OR = [
        { descripcion: { contains: q, mode: "insensitive" } },
        { ultimoMovimientoTexto: { contains: q, mode: "insensitive" } },
        { cliente: { nombre: { contains: q, mode: "insensitive" } } },
        { cliente: { documento: { contains: q, mode: "insensitive" } } },
        { catalogo: { nombre: { contains: q, mode: "insensitive" } } },
      ];
    }

    const lista = await prisma.asunto.findMany({
      where,
      orderBy: [{ ordinal: "desc" }],
      take: 500,
      select: {
        id: true,
        ordinal: true,
        tipo: true,
        estado: true,
        fechaInicio: true,
        fechaAlertaVencimiento: true,
        fechaFinalizacion: true,
        ultimoMovimientoFecha: true,
        ultimoMovimientoTexto: true,
        descripcion: true,
        cliente: { select: { id: true, nombre: true, documento: true } },
        catalogo: { select: { nombre: true } },
        socioReferente: { select: { nombre: true } },
        profesionalACargo: { select: { nombre: true } },
        colaboradorACargo: { select: { nombre: true } },
        colaboradorACargo2: { select: { nombre: true } },
        contadorReferente: { select: { nombre: true } },
      },
    });

    return NextResponse.json(lista);
  } catch {
    return NextResponse.json(
      { error: "No se pudo listar asuntos. Revisa la base de datos." },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  const auth = await requiereApiSesion();
  if (!auth.ok) {
    return auth.response;
  }

  const errorConfiguracion = obtenerErrorConfiguracionDb();
  if (errorConfiguracion) {
    return NextResponse.json({ error: errorConfiguracion }, { status: 503 });
  }

  try {
    const body = await request.json();

    const tipoRaw = String(body?.tipo ?? "");
    const tipo = TIPOS.includes(tipoRaw as TipoAsunto) ? (tipoRaw as TipoAsunto) : null;
    const clienteId = String(body?.clienteId ?? "").trim();
    const asuntoNombre = String(body?.asuntoNombre ?? "").trim();
    const profesionalACargoId = String(body?.profesionalACargoId ?? "").trim() || null;
    const colaboradorACargoId = String(body?.colaboradorACargoId ?? "").trim() || null;
    const colaboradorACargo2Id = String(body?.colaboradorACargo2Id ?? "").trim() || null;
    const contadorReferenteId = String(body?.contadorReferenteId ?? "").trim() || null;
    const socioReferenteId = String(body?.socioReferenteId ?? "").trim() || null;
    const descripcionLibre = String(body?.descripcion ?? "").trim() || null;
    const fechaInicio = parseFechaIso(body?.fechaInicio) ?? new Date();
    const fechaAlerta = parseFechaIso(body?.fechaAlertaVencimiento);

    if (!tipo) {
      return NextResponse.json({ error: "Tipo de asunto invalido (TODOS, LEGAL o NOTARIAL)." }, { status: 400 });
    }

    const faltantes: string[] = [];
    if (!clienteId) faltantes.push("cliente");
    if (!asuntoNombre) faltantes.push("asunto de catálogo (nombre)");
    if (faltantes.length > 0) {
      return NextResponse.json(
        {
          error: `Faltan: ${faltantes.join(", ")}.`,
          camposFaltantes: faltantes,
        },
        { status: 400 },
      );
    }

    if (fechaAlerta && fechaAlerta < fechaInicio) {
      return NextResponse.json(
        { error: "La alerta de vencimiento no puede ser anterior a la fecha de inicio." },
        { status: 400 },
      );
    }

    const errEquipo = await mensajeErrorValidacionEquipoAsunto(prisma, {
      socioReferenteId,
      profesionalACargoId,
      colaboradorACargoId,
      colaboradorACargo2Id,
      contadorReferenteId,
    });
    if (errEquipo) {
      return NextResponse.json({ error: errEquipo }, { status: 400 });
    }

    const asunto = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const catalogo = await tx.asuntoCatalogo.upsert({
        where: { nombre: asuntoNombre },
        update: {},
        create: { nombre: asuntoNombre },
      });

      /** Relaciones con `connect` para evitar desajuste cliente Prisma / schema (escalares ignorados en algunos entornos). */
      const creado = await tx.asunto.create({
        data: {
          tipo,
          descripcion: descripcionLibre,
          cliente: { connect: { id: clienteId } },
          catalogo: { connect: { id: catalogo.id } },
          ...(socioReferenteId ? { socioReferente: { connect: { id: socioReferenteId } } } : {}),
          ...(profesionalACargoId ? { profesionalACargo: { connect: { id: profesionalACargoId } } } : {}),
          ...(colaboradorACargoId ? { colaboradorACargo: { connect: { id: colaboradorACargoId } } } : {}),
          ...(colaboradorACargo2Id ? { colaboradorACargo2: { connect: { id: colaboradorACargo2Id } } } : {}),
          ...(contadorReferenteId ? { contadorReferente: { connect: { id: contadorReferenteId } } } : {}),
          estado: EstadoAsunto.EN_TRAMITE,
          fechaInicio,
          fechaAlertaVencimiento: fechaAlerta,
        },
        include: {
          cliente: { select: { id: true, nombre: true } },
          catalogo: true,
          socioReferente: { select: { id: true, nombre: true } },
          profesionalACargo: { select: { id: true, nombre: true, grupo: true, puesto: true } },
          colaboradorACargo: { select: { id: true, nombre: true } },
          colaboradorACargo2: { select: { id: true, nombre: true } },
          contadorReferente: { select: { id: true, nombre: true } },
          seguimientos: { orderBy: { fecha: "desc" }, take: 1 },
        },
      });
      await tx.asunto.update({
        where: { id: creado.id },
        data: {
          ultimoMovimientoFecha: null,
          ultimoMovimientoTexto: null,
        },
      });

      return tx.asunto.findUniqueOrThrow({
        where: { id: creado.id },
        include: {
          cliente: { select: { id: true, nombre: true } },
          catalogo: true,
          socioReferente: { select: { id: true, nombre: true } },
          profesionalACargo: { select: { id: true, nombre: true, grupo: true, puesto: true } },
          colaboradorACargo: { select: { id: true, nombre: true } },
          colaboradorACargo2: { select: { id: true, nombre: true } },
          contadorReferente: { select: { id: true, nombre: true } },
          seguimientos: { orderBy: { fecha: "desc" } },
        },
      });
    });

    await registrarAuditoria({
      usuarioId: auth.sesion.sub,
      accion: "ASUNTO_CREAR",
      entidad: "Asunto",
      entidadId: asunto.id,
      detalle: { ordinal: asunto.ordinal, tipo: asunto.tipo },
    });

    return NextResponse.json(asunto, { status: 201 });
  } catch (err) {
    if (esPrismaValidacion(err)) {
      console.error("[asuntos POST] validacion Prisma", err);
      return NextResponse.json(
        {
          error: "Datos invalidos para crear el asunto. Revisa que el cliente exista y vuelve a intentar.",
          detalle: process.env.NODE_ENV === "development" ? err.message : undefined,
        },
        { status: 400 },
      );
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
      return NextResponse.json(
        { error: "Alguna referencia no existe en la base (cliente, catálogo o miembro del equipo)." },
        { status: 400 },
      );
    }
    console.error("[asuntos POST]", err);
    const mensaje = mensajeErrorApiDbAcceso(err);
    const payload: { error: string; detalle?: string } = { error: mensaje };
    if (process.env.NODE_ENV === "development" && err instanceof Error) {
      payload.detalle = err.message;
    }
    return NextResponse.json(payload, { status: 503 });
  }
}
