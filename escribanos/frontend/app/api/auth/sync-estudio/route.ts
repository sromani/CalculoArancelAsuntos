import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { COOKIE_NEST_ACCESS, COOKIE_SESSION, sessionCookieSecureForRequest } from "@/lib/auth-constants";
import { ensureUsuarioEstudioPorEmail } from "@/lib/estudio-usuario";
import { fetchNestMeProfile } from "@/lib/nest-internal-profile";
import { crearTokenSesion } from "@/lib/session-token";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  const raw = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : null;
  if (!raw) {
    return NextResponse.json({ error: "Falta token Bearer" }, { status: 401 });
  }

  const nestResult = await fetchNestMeProfile(raw);
  if (!nestResult.ok) {
    return NextResponse.json({ error: nestResult.message, code: "NEST" }, { status: 401 });
  }
  const { profile } = nestResult;

  let usuario;
  try {
    usuario = await ensureUsuarioEstudioPorEmail(profile.email);
  } catch (e) {
    console.error("[sync-estudio] ensureUsuarioEstudioPorEmail", e);
    let error = "Error al acceder a la base del estudio (DATABASE_URL).";
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P1001") {
        error =
          "No se conecta a PostgreSQL. Revisá DATABASE_URL, que Docker esté arriba (puerto 5432 en el compose) y que no uses DATABASE_URL_MAP_LOCAL_5432_TO_5433 salvo que tu host mapee 5433.";
      } else if (e.code === "P1003") {
        const nombre =
          typeof e.meta?.database_name === "string" ? e.meta.database_name : "sistema_escribanos_estudio";
        error = `La base "${nombre}" no existe en el servidor de Postgres. En la carpeta escribanos/frontend ejecutá: npm run db:estudio:setup (con Docker) o creá la base a mano y luego npm run db:estudio:push.`;
      }
    } else {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("P1001") || msg.includes("Can't reach database server")) {
        error =
          "No se conecta a PostgreSQL. Revisá DATABASE_URL y que el contenedor Postgres esté en marcha.";
      } else if (
        msg.includes("relation") ||
        msg.includes("Unknown table") ||
        /table.*does not exist/i.test(msg)
      ) {
        error =
          "La base conectada no es la del estudio (tablas distintas). Revisá que en .env.local DATABASE_URL apunte a sistema_escribanos_estudio, no a la base del API.";
      } else if (msg.includes("P1003") || msg.includes("does not exist")) {
        error =
          'La base del estudio no existe. Ejecutá en escribanos/frontend: npm run db:estudio:setup (o npm run db:estudio:create y npm run db:estudio:push).';
      }
    }
    const body: { error: string; code: string; detalle?: string } = { error, code: "DB" };
    if (process.env.NODE_ENV === "development") {
      body.detalle = e instanceof Error ? e.message : String(e);
    }
    return NextResponse.json(body, { status: 500 });
  }

  let token: string;
  try {
    token = await crearTokenSesion({
      sub: usuario.id,
      usuario: usuario.usuario,
      rol: usuario.rol,
    });
  } catch (e) {
    console.error("[sync-estudio] crearTokenSesion", e);
    return NextResponse.json(
      {
        error:
          "No se pudo firmar la sesión del estudio. Revisá AUTH_SECRET en .env.local (>=32 caracteres) o reiniciá con `next dev`.",
        code: "SESSION",
      },
      { status: 500 },
    );
  }

  const response = NextResponse.json({ ok: true });
  const secure = sessionCookieSecureForRequest(request);
  const cookieOpts = {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    sameSite: "lax" as const,
    secure,
  };
  response.cookies.set(COOKIE_SESSION, token, cookieOpts);
  // Misma sesión Nest que el front guarda en localStorage: el middleware puede verificarla sin depender solo de estudio_session.
  response.cookies.set(COOKIE_NEST_ACCESS, raw, cookieOpts);
  return response;
}
