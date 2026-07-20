/**
 * Valida el access token del API de cuentas llamando a GET /auth/me.
 */
import { backendApiBaseUrl, backendApiUrl } from "@/lib/backend-api-url";

export type NestMeProfile = { id: string; email: string };

export type FetchNestMeResult =
  | { ok: true; profile: NestMeProfile }
  | { ok: false; message: string };

export async function fetchNestMeProfile(accessToken: string): Promise<FetchNestMeResult> {
  const base = backendApiBaseUrl();
  const url = backendApiUrl("auth/me");
  try {
    const r = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    if (r.status === 401 || r.status === 403) {
      return {
        ok: false,
        message:
          "La sesión del API no es válida o expiró. Cerrá sesión en el sitio y volvé a iniciar sesión.",
      };
    }
    if (!r.ok) {
      return {
        ok: false,
        message: `El API de cuentas respondió ${r.status}. Comprobá que el backend esté en marcha: ${base} (variable BACKEND_API_URL).`,
      };
    }
    const user = (await r.json()) as { id?: unknown; email?: unknown };
    if (typeof user.id !== "string" || typeof user.email !== "string") {
      return {
        ok: false,
        message: "El API devolvió un perfil incompleto (faltan id o email).",
      };
    }
    return { ok: true, profile: { id: user.id, email: user.email.toLowerCase() } };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const esTimeout = msg.includes("abort") || msg.includes("Timeout");
    const esRed =
      msg.includes("fetch failed") ||
      msg.includes("ECONNREFUSED") ||
      msg.includes("ENOTFOUND") ||
      msg.includes("aggregate") ||
      esTimeout;
    if (esRed) {
      return {
        ok: false,
        message: `No se pudo conectar con el API de cuentas en ${url}. Iniciá el backend (puerto 4000): npm run dev:backend — y revisá BACKEND_API_URL en .env.local.`,
      };
    }
    console.error("[fetchNestMeProfile]", e);
    return { ok: false, message: msg || "Error al contactar el API de cuentas." };
  }
}
