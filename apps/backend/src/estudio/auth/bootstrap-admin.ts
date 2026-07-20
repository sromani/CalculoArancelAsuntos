import * as bcrypt from 'bcryptjs';
import { PrismaEstudioService } from '../../prisma/prisma-estudio.service';

/** Misma clave que `escribanos/frontend/prisma/seed.js` y `lib/auth-inicial.ts` */
export const CLAVE_ADMIN_INICIAL = 'Admin1234.v1';

/** Crea `admin` si no existe (solo desarrollo). */
export async function asegurarUsuarioAdmin(prisma: PrismaEstudioService): Promise<void> {
  if (process.env.NODE_ENV === 'production') return;
  try {
    const existe = await prisma.usuario.findUnique({ where: { usuario: 'admin' } });
    if (existe) return;
    const passwordHash = await bcrypt.hash(CLAVE_ADMIN_INICIAL, 10);
    await prisma.usuario.create({
      data: {
        usuario: 'admin',
        nombre: 'Administrador',
        passwordHash,
        rol: 'ADMIN',
        activo: true,
      },
    });
  } catch {
    /* tabla inexistente o DB caída */
  }
}
