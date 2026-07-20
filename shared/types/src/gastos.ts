import type { CategoriaGasto, EstadoGasto, MonedaGasto } from "./enums";

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

export type GastosListadoResponse = {
  items: GastoRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
