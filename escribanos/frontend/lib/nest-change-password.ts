/**
 * Cambia la contraseña en la cuenta del API de cuentas (misma que el login con email del sitio).
 */
import { backendApiUrl } from "@/lib/backend-api-url";

export async function nestChangePassword(
  accessToken: string,
  currentPassword: string,
  newPassword: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const url = backendApiUrl("auth/change-password");
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
        message: `No se pudo conectar con el API en ${url}. Revisá que el backend esté en marcha (BACKEND_API_URL, puerto 4000).`,
      };
    }
    return { ok: false, message: msg || "Error al cambiar la contraseña en el API." };
  }
}
