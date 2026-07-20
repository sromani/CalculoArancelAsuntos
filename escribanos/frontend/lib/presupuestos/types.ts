import type { EstadoPresupuesto, MonedaGasto } from "@prisma/client";
import type { LineasDesgloseLiquido } from "@/lib/arancel/liquido-escribano";

export type PresupuestoGastoLineaRow = {
  id: string;
  gastoId: string;
  importe: number;
  moneda: MonedaGasto;
  incluido: boolean;
  orden: number;
  gasto: {
    id: string;
    nombre: string;
    categoria: string;
    oficinaPublica: string | null;
    estado: string;
  };
};

export type PresupuestoRow = {
  id: string;
  numero: number;
  clienteId: string;
  asuntoId: string | null;
  estado: EstadoPresupuesto;
  titulo: string | null;
  actoCapituloId: string | null;
  actoPosDoc: number | null;
  actoPosBien: number | null;
  actoDescripcion: string | null;
  actoSnapshot: unknown;
  monedaHonorario: string;
  honorarioArancel: number;
  honorarioACobrar: number;
  fonasaPct: number;
  irpfPct: number;
  desgloseArancel: LineasDesgloseLiquido | null;
  desglosePresupuesto: LineasDesgloseLiquido | null;
  totalGastos: number;
  totalPresupuesto: number;
  fechaCotizacion: string | null;
  cotizacionesSnapshot: unknown;
  notas: string | null;
  duplicadoDeId: string | null;
  createdAt: string;
  updatedAt: string;
  cliente: { id: string; nombre: string; documento: string };
  asunto: { id: string; ordinal: number; descripcion: string | null } | null;
  lineasGastos: PresupuestoGastoLineaRow[];
};

export type PresupuestoInput = {
  clienteId: string;
  asuntoId?: string | null;
  titulo?: string | null;
  estado?: EstadoPresupuesto;
  actoCapituloId?: string | null;
  actoPosDoc?: number | null;
  actoPosBien?: number | null;
  actoDescripcion?: string | null;
  actoSnapshot?: unknown;
  monedaHonorario?: string;
  honorarioArancel?: number;
  honorarioACobrar?: number;
  fonasaPct?: number;
  irpfPct?: number;
  desgloseArancel?: LineasDesgloseLiquido | null;
  desglosePresupuesto?: LineasDesgloseLiquido | null;
  fechaCotizacion?: string | null;
  cotizacionesSnapshot?: unknown;
  notas?: string | null;
  gastoIds?: string[];
};

export type PresupuestoHistorialRow = {
  id: string;
  accion: string;
  detalle: unknown;
  createdAt: string;
  usuario: { id: string; nombre: string } | null;
};

export const ETIQUETA_ESTADO_PRESUPUESTO: Record<EstadoPresupuesto, string> = {
  BORRADOR: "Borrador",
  EMITIDO: "Emitido",
  ACEPTADO: "Aceptado",
  RECHAZADO: "Rechazado",
  ANULADO: "Anulado",
};

export const CLASE_ESTADO_PRESUPUESTO: Record<EstadoPresupuesto, string> = {
  BORRADOR: "bg-neutral-100 text-neutral-700 ring-neutral-200/80",
  EMITIDO: "bg-sky-50 text-sky-800 ring-sky-200/80",
  ACEPTADO: "bg-emerald-50 text-emerald-800 ring-emerald-200/80",
  RECHAZADO: "bg-rose-50 text-rose-800 ring-rose-200/80",
  ANULADO: "bg-neutral-50 text-neutral-500 ring-neutral-200/80",
};

export const ESTADOS_PRESUPUESTO = Object.keys(ETIQUETA_ESTADO_PRESUPUESTO) as EstadoPresupuesto[];
