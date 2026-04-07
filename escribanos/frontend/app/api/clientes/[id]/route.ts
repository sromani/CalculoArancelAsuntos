import { EstadoAsunto, Prisma, TipoPersona, type TipoDocumento } from "@prisma/client";
import { NextResponse } from "next/server";
import { requiereApiSesion } from "@/lib/api-auth";
import { registrarAuditoria } from "@/lib/auditoria";
import { obtenerErrorConfiguracionDb } from "@/lib/api-db";
import { prisma } from "@/lib/prisma";
import {
  construirEstadoCivilPersistido,
  esEstadoCivilCliente,
  esTipoDocumentoCliente,
  mensajeValidacionDocumentoCliente,
  normalizarNombrePersona,
  normalizarDocumentoCliente,
  parseFechaNacimientoCliente,
} from "@/lib/validaciones";

type Params = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, context: Params) {
  const auth = await requiereApiSesion();
  if (!auth.ok) {
    return auth.response;
  }

  const errorConfiguracion = obtenerErrorConfiguracionDb();
  if (errorConfiguracion) {
    return NextResponse.json({ error: errorConfiguracion }, { status: 503 });
  }

  const { id } = await context.params;

  try {
    const body = await request.json();
    const nombre =
      body?.nombre !== undefined ? normalizarNombrePersona(String(body.nombre)) : undefined;
    const tipoDocumentoRaw =
      body?.tipoDocumento !== undefined ? String(body.tipoDocumento).toUpperCase() : undefined;
    const tipoPersonaRaw =
      body?.tipoPersona !== undefined ? String(body.tipoPersona).toUpperCase() : undefined;
    const tipoPersona =
      tipoPersonaRaw === "FISICA" || tipoPersonaRaw === "JURIDICA"
        ? (tipoPersonaRaw as TipoPersona)
        : tipoPersonaRaw !== undefined
          ? null
          : undefined;
    const documentoInput = body?.documento !== undefined ? String(body.documento) : undefined;
    const contacto = body?.contacto !== undefined ? String(body.contacto).trim() || null : undefined;
    const telefono = body?.telefono !== undefined ? String(body.telefono).trim() || null : undefined;
    const email = body?.email !== undefined ? String(body.email).trim() || null : undefined;
    const domicilio = body?.domicilio !== undefined ? String(body.domicilio).trim() || null : undefined;

    const fechaNacimientoInput = body?.fechaNacimiento;
    const estadoCivilInput = body?.estadoCivil;
    const nupciasInput = body?.nupcias;
    const conyugeInput = body?.conyuge;
    if (nombre !== undefined && nombre !== "" && !nombre.includes(",")) {
      return NextResponse.json(
        { error: "Nombre invalido. Debe incluir apellidos y nombres." },
        { status: 400 },
      );
    }


    const existente = await prisma.cliente.findUnique({ where: { id } });
    if (!existente) {
      return NextResponse.json({ error: "Cliente no encontrado." }, { status: 404 });
    }

    if (tipoDocumentoRaw !== undefined && !esTipoDocumentoCliente(tipoDocumentoRaw)) {
      return NextResponse.json({ error: "Tipo de documento invalido." }, { status: 400 });
    }
    if (tipoPersona === null) {
      return NextResponse.json({ error: "Tipo de persona invalido." }, { status: 400 });
    }

    const tipoDocFinal = (tipoDocumentoRaw ?? existente.tipoDocumento) as TipoDocumento;
    const docFinal =
      documentoInput !== undefined
        ? normalizarDocumentoCliente(tipoDocFinal, documentoInput)
        : existente.documento;

    const errDoc = mensajeValidacionDocumentoCliente(
      tipoDocFinal,
      documentoInput !== undefined ? documentoInput : docFinal,
    );
    if (errDoc) {
      return NextResponse.json({ error: errDoc }, { status: 400 });
    }

    const tipoFinal = tipoPersona !== undefined ? (tipoPersona as TipoPersona) : existente.tipoPersona;

    let fechaNacimiento: Date | null | undefined;
    if (fechaNacimientoInput !== undefined) {
      if (fechaNacimientoInput === null || fechaNacimientoInput === "") {
        fechaNacimiento = null;
      } else {
        const fn = parseFechaNacimientoCliente(fechaNacimientoInput);
        if (fn === null) {
          return NextResponse.json({ error: "Fecha de nacimiento invalida (use AAAA-MM-DD)." }, { status: 400 });
        }
        fechaNacimiento = fn;
      }
    }

    let estadoCivil: string | null | undefined;
    if (estadoCivilInput !== undefined) {
      const raw =
        estadoCivilInput === null || estadoCivilInput === ""
          ? null
          : String(estadoCivilInput).toUpperCase();
      if (raw !== null && !esEstadoCivilCliente(raw)) {
        return NextResponse.json({ error: "Estado civil invalido." }, { status: 400 });
      }
      estadoCivil = raw;
    }

    await prisma.cliente.update({
      where: { id },
      data: {
        ...(nombre !== undefined ? { nombre } : {}),
        ...(tipoDocumentoRaw !== undefined ? { tipoDocumento: tipoDocFinal } : {}),
        ...(tipoPersona !== undefined ? { tipoPersona: tipoPersona as TipoPersona } : {}),
        ...(documentoInput !== undefined ? { documento: docFinal } : {}),
        ...(contacto !== undefined ? { contacto } : {}),
        ...(telefono !== undefined ? { telefono } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(domicilio !== undefined ? { domicilio } : {}),
      },
    });

    const debeActualizarFechaEstado =
      fechaNacimientoInput !== undefined ||
      estadoCivilInput !== undefined ||
      (tipoPersona !== undefined && tipoFinal !== existente.tipoPersona);

    if (debeActualizarFechaEstado) {
      let fechaVal: Date | null;
      if (tipoFinal === TipoPersona.JURIDICA) {
        fechaVal = null;
      } else if (fechaNacimientoInput !== undefined) {
        fechaVal = fechaNacimiento ?? null;
      } else {
        fechaVal = existente.fechaNacimiento;
      }

      let estadoVal: string | null;
      if (tipoFinal === TipoPersona.JURIDICA) {
        estadoVal = null;
      } else if (estadoCivilInput !== undefined) {
        const nupciasRaw =
          nupciasInput !== undefined && nupciasInput !== null && String(nupciasInput).trim() !== ""
            ? Number(nupciasInput)
            : null;
        const conyugeRaw =
          conyugeInput !== undefined && conyugeInput !== null ? String(conyugeInput).trim() || null : null;
        estadoVal = construirEstadoCivilPersistido(estadoCivil ?? null, nupciasRaw, conyugeRaw);
      } else {
        estadoVal = existente.estadoCivil;
      }

      await prisma.$executeRaw(
        Prisma.sql`
          UPDATE "Cliente"
          SET
            "fechaNacimiento" = ${fechaVal},
            "estadoCivil" = ${estadoVal}
          WHERE "id" = ${id}
        `,
      );
    }

    const actualizado = await prisma.cliente.findUniqueOrThrow({ where: { id } });

    await registrarAuditoria({
      usuarioId: auth.sesion.sub,
      accion: "CLIENTE_ACTUALIZAR",
      entidad: "Cliente",
      entidadId: id,
      detalle: { campos: Object.keys(body ?? {}) },
    });

    return NextResponse.json(actualizado);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return NextResponse.json({ error: "Ya existe otro cliente con ese documento." }, { status: 409 });
    }
    return NextResponse.json({ error: "No se pudo actualizar el cliente." }, { status: 503 });
  }
}

export async function DELETE(_request: Request, context: Params) {
  const auth = await requiereApiSesion();
  if (!auth.ok) {
    return auth.response;
  }

  const errorConfiguracion = obtenerErrorConfiguracionDb();
  if (errorConfiguracion) {
    return NextResponse.json({ error: errorConfiguracion }, { status: 503 });
  }

  const { id } = await context.params;

  try {
    const enTramite = await prisma.asunto.count({
      where: { clienteId: id, estado: EstadoAsunto.EN_TRAMITE },
    });
    if (enTramite > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar: el cliente tiene asuntos EN TRAMITE." },
        { status: 409 },
      );
    }

    const totalAsuntos = await prisma.asunto.count({ where: { clienteId: id } });
    if (totalAsuntos > 0) {
      return NextResponse.json(
        {
          error:
            "No se puede eliminar: el cliente tiene asuntos en historial. Contactar administracion para archivo/migracion.",
        },
        { status: 409 },
      );
    }

    await prisma.cliente.delete({ where: { id } });

    await registrarAuditoria({
      usuarioId: auth.sesion.sub,
      accion: "CLIENTE_ELIMINAR",
      entidad: "Cliente",
      entidadId: id,
      detalle: {},
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "No se pudo eliminar el cliente." }, { status: 503 });
  }
}
