import { z } from "zod";
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export declare const registerSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    nombre: z.ZodString;
    apellido: z.ZodString;
    ci: z.ZodString;
}, z.core.$strip>;
export declare const gastoInputSchema: z.ZodObject<{
    nombre: z.ZodString;
    categoria: z.ZodEnum<{
        [x: string]: string;
    }>;
    oficinaPublica: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    descripcion: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    fecha: z.ZodString;
    fechaVencimiento: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    importe: z.ZodNumber;
    moneda: z.ZodEnum<{
        [x: string]: string;
    }>;
    estado: z.ZodOptional<z.ZodEnum<{
        [x: string]: string;
    }>>;
    observaciones: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    catalogoItemId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    clienteId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    asuntoId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
export type LoginSchema = z.infer<typeof loginSchema>;
export type RegisterSchema = z.infer<typeof registerSchema>;
export type GastoInputSchema = z.infer<typeof gastoInputSchema>;
