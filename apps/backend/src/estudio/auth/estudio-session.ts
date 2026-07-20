import type { RolSesion, EstudioSession } from '@shared/types';
import { SignJWT, jwtVerify } from 'jose';

const ROLES_VALIDOS = new Set<RolSesion>([
  'ADMIN',
  'USUARIO',
  'SOCIO',
  'PROFESIONAL',
  'COLABORADOR',
  'CONTADOR',
  'SOLO_LECTURA',
]);

const SECRETO_DESARROLLO_FIJO = 'desarrollo-auth-secret-32chars!!';

function obtenerClaveSecreta(): Uint8Array {
  const secreto = process.env.AUTH_SECRET?.trim();
  if (secreto && secreto.length >= 32) {
    return new TextEncoder().encode(secreto);
  }
  return new TextEncoder().encode(SECRETO_DESARROLLO_FIJO);
}

export async function crearTokenEstudio(payload: EstudioSession): Promise<string> {
  return new SignJWT({ usuario: payload.usuario, rol: payload.rol })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(obtenerClaveSecreta());
}

export async function verificarTokenEstudio(token: string): Promise<EstudioSession | null> {
  try {
    const { payload } = await jwtVerify(token, obtenerClaveSecreta());
    const sub = payload.sub;
    const usuario = payload.usuario;
    const rol = payload.rol;
    if (typeof sub !== 'string' || typeof usuario !== 'string' || typeof rol !== 'string') {
      return null;
    }
    if (!ROLES_VALIDOS.has(rol as RolSesion)) {
      return null;
    }
    return { sub, usuario, rol: rol as RolSesion };
  } catch {
    return null;
  }
}

export function puedeGestionarGastos(rol: RolSesion): boolean {
  return (
    rol === 'ADMIN' ||
    rol === 'SOCIO' ||
    rol === 'PROFESIONAL' ||
    rol === 'COLABORADOR' ||
    rol === 'CONTADOR' ||
    rol === 'USUARIO'
  );
}

export function esSoloLectura(rol: RolSesion): boolean {
  return rol === 'SOLO_LECTURA';
}
