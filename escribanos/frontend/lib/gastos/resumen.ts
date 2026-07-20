import type { CategoriaGasto, EstadoGasto, Gasto, MonedaGasto } from "@prisma/client";
import type { ResumenGastos } from "./types";
import { ETIQUETA_MONEDA } from "./types";
import { estadoGastoEfectivo } from "./estado";

const MESES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

/** Suma importes en pesos equivalentes (solo PESOS por ahora; otras monedas se listan aparte). */
function sumPesos(gastos: Gasto[]): number {
  return gastos.reduce((acc, g) => {
    if (g.moneda === "PESOS") return acc + g.importe;
    return acc;
  }, 0);
}

export function fmtImporte(importe: number, moneda: MonedaGasto = "PESOS"): string {
  const fmt = new Intl.NumberFormat("es-UY", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(importe);
  return moneda === "PESOS" ? `$ ${fmt}` : `${fmt} ${ETIQUETA_MONEDA[moneda]}`;
}

export function fmtFecha(iso: string | Date | null): string {
  if (!iso) return "—";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-UY", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function calcularResumenGastos(gastos: Gasto[]): ResumenGastos {
  const ahora = new Date();
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);

  const conEstado = gastos.map((g) => ({
    ...g,
    estadoEfectivo: estadoGastoEfectivo(g.estado, g.fechaVencimiento, ahora),
  }));

  const delMes = conEstado.filter((g) => g.fecha >= inicioMes);
  const pendientes = conEstado.filter((g) => g.estadoEfectivo === "PENDIENTE");
  const vencidos = conEstado.filter((g) => g.estadoEfectivo === "VENCIDO");
  const pagados = conEstado.filter((g) => g.estadoEfectivo === "PAGO_REALIZADO");

  const porMesMap = new Map<string, { total: number; cantidad: number }>();
  for (const g of conEstado) {
    const key = `${g.fecha.getFullYear()}-${String(g.fecha.getMonth() + 1).padStart(2, "0")}`;
    const prev = porMesMap.get(key) ?? { total: 0, cantidad: 0 };
    if (g.moneda === "PESOS") prev.total += g.importe;
    prev.cantidad += 1;
    porMesMap.set(key, prev);
  }

  const porMes = [...porMesMap.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 12)
    .map(([mes, v]) => {
      const [y, m] = mes.split("-");
      return {
        mes,
        label: `${MESES[parseInt(m, 10) - 1]} ${y}`,
        total: v.total,
        cantidad: v.cantidad,
      };
    });

  const porEstadoMap = new Map<EstadoGasto, { total: number; cantidad: number }>();
  for (const g of conEstado) {
    const prev = porEstadoMap.get(g.estadoEfectivo) ?? { total: 0, cantidad: 0 };
    if (g.moneda === "PESOS") prev.total += g.importe;
    prev.cantidad += 1;
    porEstadoMap.set(g.estadoEfectivo, prev);
  }

  const porCategoriaMap = new Map<CategoriaGasto, { total: number; cantidad: number }>();
  for (const g of conEstado) {
    const prev = porCategoriaMap.get(g.categoria) ?? { total: 0, cantidad: 0 };
    if (g.moneda === "PESOS") prev.total += g.importe;
    prev.cantidad += 1;
    porCategoriaMap.set(g.categoria, prev);
  }

  return {
    totalGastos: sumPesos(gastos),
    totalPendiente: sumPesos(pendientes),
    totalVencido: sumPesos(vencidos),
    totalPagado: sumPesos(pagados),
    gastosDelMes: sumPesos(delMes),
    cantidadDelMes: delMes.length,
    cantidadPendientes: pendientes.length,
    cantidadVencidos: vencidos.length,
    porMes,
    porEstado: [...porEstadoMap.entries()].map(([estado, v]) => ({
      estado,
      total: v.total,
      cantidad: v.cantidad,
    })),
    porCategoria: [...porCategoriaMap.entries()].map(([categoria, v]) => ({
      categoria,
      total: v.total,
      cantidad: v.cantidad,
    })),
  };
}
