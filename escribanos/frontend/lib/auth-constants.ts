/** Nombre de la cookie de sesion (JWT interno estudio). */
export const COOKIE_SESSION = "estudio_session";

/** JWT del API Nest (misma sesión que localStorage); permite middleware /estudio sin segundo login. */
export const COOKIE_NEST_ACCESS = "nest_access";

/** Timeout de inactividad: 15 minutos sin uso. */
export const SESSION_MAX_AGE = 60 * 15;

/**
 * Cookie `Secure`: solo se envía por HTTPS.
 * Preferí `sessionCookieSecureForRequest` en rutas API: con `next start` en http://localhost
 * NODE_ENV es production y esta función devolvía true → el navegador **no guardaba** cookies.
 *
 * En `.env`: `AUTH_COOKIE_SECURE=0` fuerza inseguras; `AUTH_COOKIE_SECURE=1` fuerza seguras.
 */
export function sessionCookieSecure(): boolean {
  const v = process.env.AUTH_COOKIE_SECURE?.trim().toLowerCase();
  if (v === "0" || v === "false" || v === "no") {
    return false;
  }
  if (v === "1" || v === "true" || v === "yes") {
    return true;
  }
  return process.env.NODE_ENV === "production";
}

/**
 * Alinea `Secure` con el protocolo real (http vs https) de la petición.
 * Detrás de proxy TLS usá `x-forwarded-proto` (p. ej. `https`).
 */
export function sessionCookieSecureForRequest(request: Request): boolean {
  const v = process.env.AUTH_COOKIE_SECURE?.trim().toLowerCase();
  if (v === "0" || v === "false" || v === "no") {
    return false;
  }
  if (v === "1" || v === "true" || v === "yes") {
    return true;
  }
  const forwarded = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim().toLowerCase();
  if (forwarded === "https") {
    return true;
  }
  if (forwarded === "http") {
    return false;
  }
  try {
    return new URL(request.url).protocol === "https:";
  } catch {
    return sessionCookieSecure();
  }
}
