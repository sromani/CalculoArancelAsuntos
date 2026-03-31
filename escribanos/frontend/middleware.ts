import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_NEST_ACCESS, COOKIE_SESSION } from "@/lib/auth-constants";

function jsonUnauthorized() {
  return NextResponse.json({ error: "No autorizado. Inicia sesion." }, { status: 401 });
}

const PUBLIC_PAGES = new Set([
  "/",
  "/login",
  "/simulador",
  "/planes",
  "/sobre-nosotros",
  "/restablecer-contrasena",
  "/perfil",
]);

/**
 * Edge Middleware: no verificar JWT aquí (no hay llamada al API Nest).
 * Solo comprobamos presencia de cookies; la validez se comprueba en Node (layouts, /api/*).
 */
function cookiePareceJwtNest(valor: string): boolean {
  const partes = valor.split(".");
  return partes.length === 3 && partes.every((p) => p.length > 0);
}

function tieneSesionEstudio(request: NextRequest): boolean {
  if (request.cookies.get(COOKIE_SESSION)?.value) {
    return true;
  }
  const nest = request.cookies.get(COOKIE_NEST_ACCESS)?.value;
  if (nest && cookiePareceJwtNest(nest)) {
    return true;
  }
  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.match(/\.(?:svg|png|jpg|jpeg|gif|webp|ico)$/)
  ) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    const lower = pathname.toLowerCase();
    if (lower === "/api/auth/login" || lower.startsWith("/api/auth/login/")) {
      return NextResponse.next();
    }
    if (lower === "/api/auth/sync-estudio" || lower.startsWith("/api/auth/sync-estudio/")) {
      return NextResponse.next();
    }
    if (pathname.startsWith("/api/health")) {
      return NextResponse.next();
    }
    if (pathname.startsWith("/api/auth/logout")) {
      return NextResponse.next();
    }

    if (!tieneSesionEstudio(request)) {
      return jsonUnauthorized();
    }
    return NextResponse.next();
  }

  if (pathname === "/login") {
    return NextResponse.next();
  }

  if (PUBLIC_PAGES.has(pathname) || pathname.startsWith("/perfil")) {
    return NextResponse.next();
  }

  /** Gestión del estudio: la app cliente comprueba login y sincroniza cookies; no redirigir aquí. */
  if (pathname.startsWith("/estudio")) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
