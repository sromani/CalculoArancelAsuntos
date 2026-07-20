import { z } from "zod";
import { CATEGORIAS_GASTO, ESTADOS_GASTO, MONEDAS_GASTO } from "@shared/types";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const registerSchema = loginSchema.extend({
  nombre: z.string().min(1),
  apellido: z.string().min(1),
  ci: z.string().min(1),
});

export const gastoInputSchema = z.object({
  nombre: z.string().min(1),
  categoria: z.enum(CATEGORIAS_GASTO as [string, ...string[]]),
  oficinaPublica: z.string().nullable().optional(),
  descripcion: z.string().nullable().optional(),
  fecha: z.string().min(1),
  fechaVencimiento: z.string().nullable().optional(),
  importe: z.number().finite().min(0),
  moneda: z.enum(MONEDAS_GASTO as [string, ...string[]]),
  estado: z.enum(ESTADOS_GASTO as [string, ...string[]]).optional(),
  observaciones: z.string().nullable().optional(),
  catalogoItemId: z.string().nullable().optional(),
  clienteId: z.string().nullable().optional(),
  asuntoId: z.string().nullable().optional(),
});

export type LoginSchema = z.infer<typeof loginSchema>;
export type RegisterSchema = z.infer<typeof registerSchema>;
export type GastoInputSchema = z.infer<typeof gastoInputSchema>;
