/**
 * Ajustes para que Prisma conecte bien en desarrollo local (Windows + Docker).
 *
 * 1) `localhost` → `127.0.0.1` (evita IPv6 / P1001 con Docker Desktop).
 * 2) El compose del repo usa `5432:5432`. Solo si tu host mapea **5433 → 5432** del contenedor,
 *    definí `DATABASE_URL_MAP_LOCAL_5432_TO_5433=1` (antes se forzaba 5433 por defecto y rompía la conexión).
 */
export function normalizarDatabaseUrlParaApp(url: string): string {
  if (!url.trim()) {
    return url;
  }
  try {
    const parsed = new URL(url);
    if (process.platform === "win32" && parsed.hostname === "localhost") {
      parsed.hostname = "127.0.0.1";
    }
    const esLocal = parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost";
    const puerto = parsed.port || "5432";
    const noProduccion = process.env.NODE_ENV !== "production";
    const mapear5433 = process.env.DATABASE_URL_MAP_LOCAL_5432_TO_5433 === "1";
    if (noProduccion && mapear5433 && esLocal && puerto === "5432") {
      parsed.port = "5433";
    }
    return parsed.toString();
  } catch {
    return url;
  }
}
