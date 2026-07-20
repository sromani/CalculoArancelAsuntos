import type { CategoriaGasto, EstadoGasto, MonedaGasto } from "@prisma/client";

export type GastoRow = {
  id: string;
  nombre: string;
  categoria: CategoriaGasto;
  oficinaPublica: string | null;
  descripcion: string | null;
  fecha: string;
  fechaVencimiento: string | null;
  importe: number;
  moneda: MonedaGasto;
  estado: EstadoGasto;
  observaciones: string | null;
  comprobantePath: string | null;
  catalogoItemId: string | null;
  clienteId: string | null;
  asuntoId: string | null;
  createdAt: string;
  updatedAt: string;
  cliente: { id: string; nombre: string; documento: string } | null;
  asunto: { id: string; ordinal: number; descripcion: string | null } | null;
  catalogoItem: { id: string; nombre: string } | null;
};

export type GastoInput = {
  nombre: string;
  categoria: CategoriaGasto;
  oficinaPublica?: string | null;
  descripcion?: string | null;
  fecha: string;
  fechaVencimiento?: string | null;
  importe: number;
  moneda: MonedaGasto;
  estado?: EstadoGasto;
  observaciones?: string | null;
  catalogoItemId?: string | null;
  clienteId?: string | null;
  asuntoId?: string | null;
};

export type GastoCatalogoRow = {
  id: string;
  nombre: string;
  categoria: CategoriaGasto;
  oficinaPublica: string | null;
  descripcion: string | null;
  importeSugerido: number | null;
  moneda: MonedaGasto;
  activo: boolean;
  orden: number;
};

export type GastosFiltros = {
  q?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  vencimientoDesde?: string;
  vencimientoHasta?: string;
  clienteId?: string;
  asuntoId?: string;
  categoria?: CategoriaGasto | "";
  estado?: EstadoGasto | "";
  page?: number;
  pageSize?: number;
};

export type GastosListadoResponse = {
  items: GastoRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type ResumenGastos = {
  totalGastos: number;
  totalPendiente: number;
  totalVencido: number;
  totalPagado: number;
  gastosDelMes: number;
  cantidadDelMes: number;
  cantidadPendientes: number;
  cantidadVencidos: number;
  porMes: { mes: string; label: string; total: number; cantidad: number }[];
  porEstado: { estado: EstadoGasto; total: number; cantidad: number }[];
  porCategoria: { categoria: CategoriaGasto; total: number; cantidad: number }[];
};

export const ETIQUETA_MONEDA: Record<MonedaGasto, string> = {
  PESOS: "$ UYU",
  DOLARES: "USD",
  UR: "UR",
  UI: "UI",
};

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

export const CLASE_ESTADO_GASTO: Record<EstadoGasto, string> = {
  PENDIENTE: "bg-amber-50 text-amber-800 ring-amber-200/80",
  PAGO_REALIZADO: "bg-emerald-50 text-emerald-800 ring-emerald-200/80",
  VENCIDO: "bg-rose-50 text-rose-800 ring-rose-200/80",
};

export const CATEGORIAS_GASTO = Object.keys(ETIQUETA_CATEGORIA) as CategoriaGasto[];
export const ESTADOS_GASTO = Object.keys(ETIQUETA_ESTADO_GASTO) as EstadoGasto[];
