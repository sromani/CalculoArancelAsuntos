"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseFechaGasto = parseFechaGasto;
exports.estadoGastoEfectivo = estadoGastoEfectivo;
exports.paginacionFromQuery = paginacionFromQuery;
function parseFechaGasto(raw) {
    if (!raw || typeof raw !== "string")
        return null;
    const d = new Date(raw.includes("T") ? raw : `${raw}T12:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
}
function estadoGastoEfectivo(estado, fechaVencimiento, now = new Date()) {
    if (estado === "PAGO_REALIZADO")
        return "PAGO_REALIZADO";
    if (fechaVencimiento && fechaVencimiento < now)
        return "VENCIDO";
    return estado === "VENCIDO" ? "VENCIDO" : "PENDIENTE";
}
function paginacionFromQuery(pageRaw, pageSizeRaw, maxPageSize = 100) {
    const page = Math.max(1, Number(pageRaw) || 1);
    const pageSize = Math.min(maxPageSize, Math.max(1, Number(pageSizeRaw) || 20));
    return { page, pageSize, skip: (page - 1) * pageSize };
}
//# sourceMappingURL=index.js.map