/** Enums de dominio compartidos (sin depender de Prisma en frontends). */

export type PlanType = "GRATIS" | "PRO" | "PLUS";

export type RolSesion =
  | "ADMIN"
  | "USUARIO"
  | "SOCIO"
  | "PROFESIONAL"
  | "COLABORADOR"
  | "CONTADOR"
  | "SOLO_LECTURA";

export type MonedaGasto = "PESOS" | "DOLARES" | "UR" | "UI";

export type CategoriaGasto =
  | "REGISTRO"
  | "TRIBUTOS"
  | "CERTIFICACIONES"
  | "CORREO"
  | "ARCHIVO"
  | "GESTIONES"
  | "OTROS";

export type EstadoGasto = "PENDIENTE" | "PAGO_REALIZADO" | "VENCIDO";

export type EstadoPresupuesto =
  | "BORRADOR"
  | "EMITIDO"
  | "ACEPTADO"
  | "RECHAZADO"
  | "ANULADO";

export const ESTADOS_PRESUPUESTO: EstadoPresupuesto[] = [
  "BORRADOR",
  "EMITIDO",
  "ACEPTADO",
  "RECHAZADO",
  "ANULADO",
];

export type TipoNotificacion =
  | "GASTO_VENCIDO"
  | "PRESUPUESTO_ESTADO"
  | "SISTEMA"
  | "RECORDATORIO";

export const CATEGORIAS_GASTO: CategoriaGasto[] = [
  "REGISTRO",
  "TRIBUTOS",
  "CERTIFICACIONES",
  "CORREO",
  "ARCHIVO",
  "GESTIONES",
  "OTROS",
];

export const ESTADOS_GASTO: EstadoGasto[] = ["PENDIENTE", "PAGO_REALIZADO", "VENCIDO"];

export const MONEDAS_GASTO: MonedaGasto[] = ["PESOS", "DOLARES", "UR", "UI"];

export const ETIQUETA_CATEGORIA: Record<CategoriaGasto, string> = {
  REGISTRO: "Registro",
  TRIBUTOS: "Tributos",
  CERTIFICACIONES: "Certificaciones",
  CORREO: "Correo",
  ARCHIVO: "Archivo",
  GESTIONES: "Gestiones",
  OTROS: "Otros",
};

export const ETIQUETA_ESTADO_GASTO: Record<EstadoGasto, string> = {
  PENDIENTE: "Pendiente",
  PAGO_REALIZADO: "Pago realizado",
  VENCIDO: "Vencido",
};

export const ETIQUETA_MONEDA: Record<MonedaGasto, string> = {
  PESOS: "$ UYU",
  DOLARES: "USD",
  UR: "UR",
  UI: "UI",
};
