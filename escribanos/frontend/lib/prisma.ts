import { existsSync } from "fs";
import { join } from "path";
import { config as loadEnv } from "dotenv";
import { normalizarDatabaseUrlParaApp } from "@/lib/database-url";
import { PrismaClient } from "@prisma/client";

/**
 * Next.js no pisa `process.env` ya definido en el sistema. Si DATABASE_URL apunta a la base
 * del API (p. ej. sistema_escribanos_db), Prisma del estudio usa la BD equivocada.
 * `.env.local` debe ganar para la URL del estudio (sistema_escribanos_estudio).
 */
function cargarEnvLocalPrioritario(): void {
  const candidatos = [
    join(process.cwd(), ".env.local"),
    join(process.cwd(), "escribanos", "frontend", ".env.local"),
  ];
  for (const path of candidatos) {
    if (existsSync(path)) {
      loadEnv({ path, override: true });
      return;
    }
  }
}

cargarEnvLocalPrioritario();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function opcionesPrismaClient(): ConstructorParameters<typeof PrismaClient>[0] {
  const url = process.env.DATABASE_URL;
  const base: ConstructorParameters<typeof PrismaClient>[0] = {
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  };
  if (url) {
    base.datasources = {
      db: { url: normalizarDatabaseUrlParaApp(url) },
    };
  }
  return base;
}

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient(opcionesPrismaClient());

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
