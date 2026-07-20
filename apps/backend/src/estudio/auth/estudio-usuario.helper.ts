import * as bcrypt from 'bcryptjs';
import { PrismaEstudioService } from '../../prisma/prisma-estudio.service';

/** Alinea usuario estudio con email del login del sitio (misma lógica que el front legacy). */
export async function asegurarUsuarioEstudioPorEmail(
  prisma: PrismaEstudioService,
  email: string,
  passwordPlano: string,
) {
  const normalized = email.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(passwordPlano, 10);
  const existente = await prisma.usuario.findUnique({ where: { usuario: normalized } });
  if (existente) {
    if (existente.activo) {
      await prisma.usuario.update({
        where: { id: existente.id },
        data: { passwordHash },
      });
    }
    return prisma.usuario.findUniqueOrThrow({ where: { id: existente.id } });
  }
  return prisma.usuario.create({
    data: {
      usuario: normalized,
      nombre: normalized.split('@')[0] || normalized,
      passwordHash,
      rol: 'PROFESIONAL',
      activo: true,
    },
  });
}
