export declare function parseFechaGasto(raw: string): Date | null;
export declare function estadoGastoEfectivo(estado: string, fechaVencimiento: Date | null | undefined, now?: Date): "PENDIENTE" | "PAGO_REALIZADO" | "VENCIDO";
export declare function paginacionFromQuery(pageRaw?: string | number | null, pageSizeRaw?: string | number | null, maxPageSize?: number): {
    page: number;
    pageSize: number;
    skip: number;
};
