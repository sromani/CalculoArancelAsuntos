/**
 * Valida el access token del API Nest llamando a GET /auth/me (misma fuente que el login).
 * Así no hace falta duplicar JWT_SECRET en el .env del front: Nest es quien verifica la firma.
 */
export type NestMeProfile = { id: string; email: string };

export type FetchNestMeResult =
  | { ok: true; profile: NestMeProfile }
  | { ok: false; message: string };

export async function fetchNestMeProfile(accessToken: string): Promise<FetchNestMeResult> {
  const base = (process.env.NEST_INTERNAL_URL?.trim() || "http://127.0.0.1:3001").replace(/\/$/, "");
  const url = `${base}/auth/me`;
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
        message: `El API Nest respondió ${r.status}. Comprobá que esté en marcha: ${base} (variable NEST_INTERNAL_URL).`,
      };
    }
    const user = (await r.json()) as { id?: unknown; email?: unknown };
    if (typeof user.id !== "string" || typeof user.email !== "string") {
      return {
        ok: false,
        message: "El API Nest devolvió un perfil incompleto (faltan id o email).",
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
        message: `No se pudo conectar con el API Nest en ${url}. Iniciá el backend (puerto 3001) y revisá NEST_INTERNAL_URL en .env.local.`,
      };
    }
    console.error("[fetchNestMeProfile]", e);
    return { ok: false, message: msg || "Error al contactar el API Nest." };
  }
}
