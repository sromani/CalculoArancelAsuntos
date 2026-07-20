import { NextResponse } from "next/server";
import { requiereApiSesion } from "@/lib/api-auth";
import { mensajeErrorApiDbAcceso, obtenerErrorConfiguracionDb } from "@/lib/api-db";
import { construirWhereGastos } from "@/lib/gastos/query";
import { calcularResumenGastos } from "@/lib/gastos/resumen";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const auth = await requiereApiSesion();
  if (!auth.ok) return auth.response;

  const errorConfiguracion = obtenerErrorConfiguracionDb();
  if (errorConfiguracion) {
    return NextResponse.json({ error: errorConfiguracion }, { status: 503 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const where = construirWhereGastos(searchParams);
    const gastos = await prisma.gasto.findMany({ where });
    return NextResponse.json(calcularResumenGastos(gastos));
  } catch (e) {
    return NextResponse.json({ error: mensajeErrorApiDbAcceso(e) }, { status: 503 });
  }
}
