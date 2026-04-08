import { Prisma } from "@prisma/client";

export function obtenerErrorConfiguracionDb(): string | null {
  if (!process.env.DATABASE_URL) {
    return "Falta configurar DATABASE_URL en el archivo .env.";
  }
  return null;
}

function mensajePorCodigoPrisma(code: string, message: string): string | null {
  switch (code) {
    case "P1001":
      return "No se puede conectar a PostgreSQL. Revisa DATABASE_URL (puerto = el de la izquierda en docker ps; en este repo suele ser 5433). En Windows conviene 127.0.0.1.";
    case "P1003":
      return "La base de datos de DATABASE_URL no existe. Crea la base (por ejemplo estudio_uy) o corrige el nombre en la URL.";
    case "P1017":
      return "PostgreSQL cerro la conexion. Reinicia el servicio de base de datos y vuelve a intentar.";
    case "P2002":
      return null;
    case "P2003":
      return "Violacion de clave foranea: algun dato relacionado no existe en la base.";
    case "P2011":
      return "Violacion de NOT NULL en la base: faltan datos obligatorios o la tabla no coincide con el modelo. En escribanos/frontend: npm run db:estudio:migrate (o db:estudio:migrate:dev si creas migraciones).";
    case "P2021":
      return "Falta una tabla en la base (modelo mas nuevo que la BD). En escribanos/frontend: npm run db:estudio:migrate";
    case "P2022":
      return "La base esta desactualizada (faltan columnas). En escribanos/frontend: npm run db:estudio:migrate";
    default:
      return `Error en la base (${code}). ${message.split("\n")[0] ?? message} — Si acabas de actualizar el codigo, en escribanos/frontend: npm run db:estudio:migrate`;
  }
}

/**
 * Mensajes claros para errores de Prisma (conexion, migraciones, etc.).
 * Para errores conocidos con codigo pero sin texto amistoso, devuelve el detalle de Prisma.
 */
export function mensajeErrorPrismaParaUsuario(error: unknown): string | null {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") return null;
    return mensajePorCodigoPrisma(error.code, error.message);
  }
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = String((error as { code?: string }).code);
    const maybeMsg = (error as unknown as { message?: unknown }).message;
    const msg =
      error instanceof Error
        ? error.message
        : typeof maybeMsg === "string"
          ? maybeMsg
          : "";
    if (code === "P2002") return null;
    return mensajePorCodigoPrisma(code, msg);
  }
  return null;
}

/**
 * Mensaje para APIs cuando falla un acceso a la base (conexion, migraciones, etc.).
 * Evita mostrar siempre "no se pudo conectar" cuando el fallo es tablas/columnas faltantes.
 */
export function mensajeErrorApiDbAcceso(error: unknown): string {
  return (
    mensajeErrorPrismaParaUsuario(error) ??
    mensajeErrorDesarrollo(error) ??
    "No se pudo acceder a la base de datos. Verifica DATABASE_URL, que PostgreSQL este en marcha y en escribanos/frontend: npm run db:estudio:migrate"
  );
}

/** Errores de validacion del cliente Prisma (argumentos invalidos). */
export function esPrismaValidacion(error: unknown): error is Prisma.PrismaClientValidationError {
  return error instanceof Prisma.PrismaClientValidationError;
}

/** Texto seguro para mostrar en desarrollo si el error no es Prisma conocido. */
export function mensajeErrorDesarrollo(error: unknown): string | null {
  if (process.env.NODE_ENV !== "development") return null;
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }
  return String(error);
}
