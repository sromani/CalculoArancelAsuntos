import { cookies } from "next/headers";
import { COOKIE_NEST_ACCESS, COOKIE_SESSION } from "@/lib/auth-constants";
import { ensureUsuarioEstudioPorEmail } from "@/lib/estudio-usuario";
import { fetchNestMeProfile } from "@/lib/nest-internal-profile";
import { verificarTokenSesion, type PayloadSesion, type RolSesion } from "@/lib/session-token";

export async function obtenerSesionServidor(): Promise<PayloadSesion | null> {
  const jar = await cookies();

  const estudioTok = jar.get(COOKIE_SESSION)?.value;
  if (estudioTok) {
    const p = await verificarTokenSesion(estudioTok);
    if (p) {
      return p;
    }
  }

  const nestTok = jar.get(COOKIE_NEST_ACCESS)?.value;
  if (nestTok) {
    const nestResult = await fetchNestMeProfile(nestTok);
    if (!nestResult.ok) {
      return null;
    }
    const usuario = await ensureUsuarioEstudioPorEmail(nestResult.profile.email);
    return {
      sub: usuario.id,
      usuario: usuario.usuario,
      rol: usuario.rol as RolSesion,
    };
  }

  return null;
}

export async function requiereSesion(): Promise<PayloadSesion> {
  const sesion = await obtenerSesionServidor();
  if (!sesion) {
    throw new Error("No autorizado");
  }
  return sesion;
}

export async function requiereAdmin(): Promise<PayloadSesion> {
  const sesion = await requiereSesion();
  if (sesion.rol !== "ADMIN") {
    throw new Error("Solo administradores");
  }
  return sesion;
}
