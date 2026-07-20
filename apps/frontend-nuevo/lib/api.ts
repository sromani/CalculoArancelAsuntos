import { ApiClient, createLocalStorageTokenStorage } from "@shared/api-client";

const storage = createLocalStorageTokenStorage("estudio_api_token");

/** En el navegador usamos el mismo origen (Next reescribe /api/v1 → backend). */
function resolveApiBaseUrl(): string {
  if (typeof window !== "undefined") return "";
  return process.env.BACKEND_URL?.trim() || process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:4000";
}

export const api = new ApiClient({
  baseUrl: resolveApiBaseUrl(),
  apiPrefix: "/api/v1",
  storage,
  credentials: "include",
  onUnauthorized: () => {
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
  },
});

export type EstudioUser = {
  sub: string;
  usuario: string;
  rol: string;
  nombre?: string;
};

export function guardarSesionEstudio(data: { token: string; usuario: string; nombre: string; rol: string }) {
  api.setToken(data.token);
  if (typeof localStorage !== "undefined") {
    localStorage.setItem("estudio_user", JSON.stringify({ usuario: data.usuario, nombre: data.nombre, rol: data.rol }));
  }
}

export function obtenerSesionLocal(): { usuario: string; nombre: string; rol: string } | null {
  if (typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem("estudio_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as { usuario: string; nombre: string; rol: string };
  } catch {
    return null;
  }
}

export function cerrarSesion() {
  api.logoutLocal();
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem("estudio_user");
  }
}
