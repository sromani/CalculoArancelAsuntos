/**
 * URL base del API de cuentas (server-side).
 * Prioridad: BACKEND_API_URL → NEST_INTERNAL_URL (legacy) → http://127.0.0.1:4000/api/v1
 */
export function backendApiBaseUrl(): string {
  const unified = process.env.BACKEND_API_URL?.trim();
  if (unified) return unified.replace(/\/$/, "");
  const legacy = process.env.NEST_INTERNAL_URL?.trim();
  if (legacy) return legacy.replace(/\/$/, "");
  return "http://127.0.0.1:4000/api/v1";
}

export function backendApiUrl(path: string): string {
  const p = path.startsWith("/") ? path.slice(1) : path;
  return `${backendApiBaseUrl()}/${p}`;
}
