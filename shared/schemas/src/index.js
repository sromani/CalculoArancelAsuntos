"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gastoInputSchema = exports.registerSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
const types_1 = require("@shared/types");
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
exports.registerSchema = exports.loginSchema.extend({
    nombre: zod_1.z.string().min(1),
    apellido: zod_1.z.string().min(1),
    ci: zod_1.z.string().min(1),
});
exports.gastoInputSchema = zod_1.z.object({
    nombre: zod_1.z.string().min(1),
    categoria: zod_1.z.enum(types_1.CATEGORIAS_GASTO),
    oficinaPublica: zod_1.z.string().nullable().optional(),
    descripcion: zod_1.z.string().nullable().optional(),
    fecha: zod_1.z.string().min(1),
    fechaVencimiento: zod_1.z.string().nullable().optional(),
    importe: zod_1.z.number().finite().min(0),
    moneda: zod_1.z.enum(types_1.MONEDAS_GASTO),
    estado: zod_1.z.enum(types_1.ESTADOS_GASTO).optional(),
    observaciones: zod_1.z.string().nullable().optional(),
    catalogoItemId: zod_1.z.string().nullable().optional(),
    clienteId: zod_1.z.string().nullable().optional(),
    asuntoId: zod_1.z.string().nullable().optional(),
});
//# sourceMappingURL=index.js.map