import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { Usuario } from "@/generated/prisma";

/**
 * Asegura un registro `Usuario` (módulo estudio) alineado al email del login Nest.
 */
export async function ensureUsuarioEstudioPorEmail(email: string): Promise<Usuario> {
  const normalized = email.toLowerCase();
  let u = await prisma.usuario.findUnique({ where: { usuario: normalized } });
  if (u) {
    return u;
  }
  const passwordHash = await bcrypt.hash(randomBytes(32).toString("hex"), 10);
  u = await prisma.usuario.create({
    data: {
      usuario: normalized,
      nombre: normalized.split("@")[0] || normalized,
      passwordHash,
      rol: "PROFESIONAL",
    },
  });
  return u;
}
