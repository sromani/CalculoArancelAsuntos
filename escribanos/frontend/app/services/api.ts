/**
 * Rutas de auth van por /nest-api (rewrite en next.config → API Nest).
 * Así el navegador solo habla con el front (mismo origen) y no hay CORS.
 */
const NEST_PREFIX = process.env.NEXT_PUBLIC_NEST_API_PREFIX?.trim() || "/nest-api";

function authUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${NEST_PREFIX}${p}`;
}

async function readErrorMessage(response: Response): Promise<string> {
  const text = await response.text();
  try {
    const j = JSON.parse(text) as { message?: string | string[] };
    if (typeof j.message === "string") return j.message;
    if (Array.isArray(j.message)) return j.message.join(". ");
  } catch {
    /* no es JSON */
  }
  if (response.status === 502 || response.status === 503 || response.status === 504) {
    return "El servicio de cuentas no está disponible. ¿Está corriendo el API en el puerto 3001 y PostgreSQL?";
  }
  if (text && text.length < 400) return text;
  return `Error ${response.status}`;
}

export async function register(data: {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  ci: string;
}) {
  let response: Response;
  try {
    response = await fetch(authUrl("/auth/register"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
  } catch {
    throw new Error(
      "No se pudo conectar. Iniciá el API Nest (puerto 3001) y la base de datos; en la raíz del monorepo: npm run dev:escribanos",
    );
  }

  if (!response.ok) {
    throw new Error((await readErrorMessage(response)) || "Error al registrarse");
  }

  return response.json();
}

export async function login(data: { email: string; password: string }) {
  let response: Response;
  try {
    response = await fetch(authUrl("/auth/login"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
  } catch {
    throw new Error(
      "No se pudo conectar. Iniciá el API Nest (puerto 3001) y la base de datos.",
    );
  }

  if (!response.ok) {
    throw new Error((await readErrorMessage(response)) || "Credenciales inválidas");
  }

  return response.json();
}

export async function getMe(token: string) {
  let response: Response;
  try {
    response = await fetch(authUrl("/auth/me"), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    throw new Error("No autorizado");
  }

  if (!response.ok) {
    throw new Error("No autorizado");
  }

  return response.json();
}

export async function forgotPassword(email: string) {
  let response: Response;
  try {
    response = await fetch(authUrl("/auth/forgot-password"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });
  } catch {
    throw new Error("No se pudo conectar con el servidor de autenticación.");
  }

  if (!response.ok) {
    throw new Error((await readErrorMessage(response)) || "Error al enviar email");
  }

  return response.json();
}

export async function resetPassword(token: string, newPassword: string) {
  let response: Response;
  try {
    response = await fetch(authUrl("/auth/reset-password"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token, newPassword }),
    });
  } catch {
    throw new Error("No se pudo conectar con el servidor de autenticación.");
  }

  if (!response.ok) {
    throw new Error((await readErrorMessage(response)) || "Error al restablecer contraseña");
  }

  return response.json();
}
