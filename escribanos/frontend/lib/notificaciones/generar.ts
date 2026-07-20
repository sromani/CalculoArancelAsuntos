import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { TipoNotificacion } from "@prisma/client";

const DIAS_ALERTA_GASTO = 7;
const DIAS_ALERTA_ASUNTO = 14;

export type NotificacionRow = {
  id: string;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  enlace: string | null;
  leida: boolean;
  entidad: string | null;
  entidadId: string | null;
  createdAt: string;
};

export function serializarNotificacion(n: {
  id: string;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  enlace: string | null;
  leida: boolean;
  entidad: string | null;
  entidadId: string | null;
  createdAt: Date;
}): NotificacionRow {
  return {
    id: n.id,
    tipo: n.tipo,
    titulo: n.titulo,
    mensaje: n.mensaje,
    enlace: n.enlace,
    leida: n.leida,
    entidad: n.entidad,
    entidadId: n.entidadId,
    createdAt: n.createdAt.toISOString(),
  };
}

async function upsertNotificacion(
  data: Prisma.NotificacionCreateInput & { entidad: string; entidadId: string; tipo: TipoNotificacion }
): Promise<void> {
  const existente = await prisma.notificacion.findFirst({
    where: {
      entidad: data.entidad,
      entidadId: data.entidadId,
      tipo: data.tipo,
      leida: false,
    },
  });
  if (existente) {
    await prisma.notificacion.update({
      where: { id: existente.id },
      data: { titulo: data.titulo, mensaje: data.mensaje, enlace: data.enlace ?? undefined },
    });
    return;
  }
  await prisma.notificacion.create({ data });
}

/** Escanea vencimientos y genera notificaciones pendientes. */
export async function generarNotificacionesEstudio(usuarioId?: string): Promise<number> {
  const ahora = new Date();
  let creadas = 0;

  const gastosVencidos = await prisma.gasto.findMany({
    where: {
      estado: { not: "PAGO_REALIZADO" },
      fechaVencimiento: { lt: ahora },
    },
    take: 50,
  });

  for (const g of gastosVencidos) {
    await upsertNotificacion({
      usuario: usuarioId ? { connect: { id: usuarioId } } : undefined,
      tipo: "GASTO_VENCIMIENTO",
      titulo: "Gasto vencido",
      mensaje: `${g.nombre} venció el ${g.fechaVencimiento?.toLocaleDateString("es-UY") ?? "—"}.`,
      enlace: `/estudio/gastos?gasto=${g.id}`,
      entidad: "Gasto",
      entidadId: g.id,
    });
    creadas += 1;
  }

  const limiteProximo = new Date(ahora);
  limiteProximo.setDate(limiteProximo.getDate() + DIAS_ALERTA_GASTO);

  const gastosProximos = await prisma.gasto.findMany({
    where: {
      estado: { not: "PAGO_REALIZADO" },
      fechaVencimiento: { gte: ahora, lte: limiteProximo },
    },
    take: 50,
  });

  for (const g of gastosProximos) {
    await upsertNotificacion({
      usuario: usuarioId ? { connect: { id: usuarioId } } : undefined,
      tipo: "GASTO_PROXIMO_VENCER",
      titulo: "Gasto próximo a vencer",
      mensaje: `${g.nombre} vence el ${g.fechaVencimiento?.toLocaleDateString("es-UY") ?? "—"}.`,
      enlace: `/estudio/gastos?gasto=${g.id}`,
      entidad: "Gasto",
      entidadId: g.id,
    });
    creadas += 1;
  }

  const limiteAsunto = new Date(ahora);
  limiteAsunto.setDate(limiteAsunto.getDate() + DIAS_ALERTA_ASUNTO);

  const asuntosAlerta = await prisma.asunto.findMany({
    where: {
      estado: "EN_TRAMITE",
      fechaAlertaVencimiento: { gte: ahora, lte: limiteAsunto },
    },
    include: { cliente: { select: { nombre: true } } },
    take: 50,
  });

  for (const a of asuntosAlerta) {
    await upsertNotificacion({
      usuario: usuarioId ? { connect: { id: usuarioId } } : undefined,
      tipo: "ASUNTO_VENCIMIENTO",
      titulo: "Asunto próximo a vencer",
      mensaje: `Asunto #${a.ordinal} (${a.cliente.nombre}) — alerta ${a.fechaAlertaVencimiento?.toLocaleDateString("es-UY") ?? ""}.`,
      enlace: `/estudio/asuntos/${a.id}`,
      entidad: "Asunto",
      entidadId: a.id,
    });
    creadas += 1;
  }

  const presupuestosPendientes = await prisma.presupuestoNotarial.findMany({
    where: { estado: { in: ["BORRADOR", "EMITIDO"] } },
    include: { cliente: { select: { nombre: true } } },
    take: 30,
  });

  for (const p of presupuestosPendientes) {
    const tipo = p.estado === "BORRADOR" ? "PRESUPUESTO_PENDIENTE" : "PAGO_PENDIENTE";
    await upsertNotificacion({
      usuario: usuarioId ? { connect: { id: usuarioId } } : undefined,
      tipo,
      titulo: p.estado === "BORRADOR" ? "Presupuesto en borrador" : "Presupuesto emitido sin confirmar",
      mensaje: `Presupuesto #${p.numero} — ${p.cliente.nombre}.`,
      enlace: `/estudio/presupuestos/${p.id}`,
      entidad: "PresupuestoNotarial",
      entidadId: p.id,
    });
    creadas += 1;
  }

  return creadas;
}
