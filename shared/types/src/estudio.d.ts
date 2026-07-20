import type { CategoriaGasto, EstadoGasto, MonedaGasto } from "./enums";
export type ClienteRow = {
    id: string;
    tipoDocumento: string;
    tipoPersona: string;
    documento: string;
    nombre: string;
    email: string | null;
    telefono: string | null;
    domicilio: string | null;
    createdAt: string;
};
export type ActoSimulador = {
    key: string;
    nombre: string;
    capituloId: string;
};
export type LineasDesglose = {
    honorario: number;
    iva: number;
    totalFactura: number;
    montepio: number;
    fondoGremial: number;
    fonasa: number;
    irpf: number;
    totalGastos: number;
    liquido: number;
};
export type SimuladorResultado = {
    acto: {
        key: string;
        nombre: string;
        articulo: string;
    };
    resultado: {
        honorarioPesos: number;
        honorarioPrincipalFormateado: string;
        monedaPrincipal: string;
    };
    lineasArancel: LineasDesglose | null;
    lineasPresupuesto: LineasDesglose | null;
};
export type PresupuestoRow = {
    id: string;
    numero: number;
    clienteId: string;
    asuntoId: string | null;
    estado: import("./enums").EstadoPresupuesto;
    titulo: string | null;
    honorarioArancel: number;
    honorarioACobrar: number;
    totalGastos: number;
    totalPresupuesto: number;
    notas: string | null;
    createdAt: string;
    updatedAt: string;
    cliente: {
        id: string;
        nombre: string;
        documento: string;
    };
    asunto: {
        id: string;
        ordinal: number;
        descripcion: string | null;
    } | null;
    lineasGastos: {
        id: string;
        gastoId: string;
        importe: number;
        moneda: MonedaGasto;
        incluido: boolean;
        gasto: {
            id: string;
            nombre: string;
            categoria: CategoriaGasto;
            estado: EstadoGasto;
        };
    }[];
};
export declare const ETIQUETA_ESTADO_PRESUPUESTO: Record<import("./enums").EstadoPresupuesto, string>;
