/**
 * Cambia la contraseña en la cuenta del API Nest (misma que el login con email del sitio).
 */
export async function nestChangePassword(
  accessToken: string,
  currentPassword: string,
  newPassword: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const base = (process.env.NEST_INTERNAL_URL?.trim() || "http://127.0.0.1:3001").replace(/\/$/, "");
  const url = `${base}/auth/change-password`;
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ currentPassword, newPassword }),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    if (r.ok) {
      return { ok: true };
    }
    let message = `El API respondió ${r.status}`;
    try {
      const j = (await r.json()) as { message?: string | string[] };
      if (typeof j.message === "string" && j.message.length > 0) {
        message = j.message;
      } else if (Array.isArray(j.message) && j.message.length > 0) {
        message = j.message.join(". ");
      }
    } catch {
      /* ignore */
    }
    return { ok: false, message };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const esRed =
      msg.includes("fetch failed") ||
      msg.includes("ECONNREFUSED") ||
      msg.includes("abort") ||
      msg.includes("Timeout");
    if (esRed) {
      return {
        ok: false,
        message: `No se pudo conectar con el API en ${url}. Revisá que el backend Nest esté en marcha (NEST_INTERNAL_URL).`,
      };
    }
    return { ok: false, message: msg || "Error al cambiar la contraseña en el API." };
  }
}
