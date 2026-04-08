import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { COOKIE_NEST_ACCESS } from "@/lib/auth-constants";
import { fetchNestMeProfile } from "@/lib/nest-internal-profile";
import { nestChangePassword } from "@/lib/nest-change-password";
import { prisma } from "@/lib/prisma";
import { obtenerSesionServidor } from "@/lib/session-server";

export const dynamic = "force-dynamic";

const MIN_NUEVA = 6;

export async function POST(request: Request) {
  const sesion = await obtenerSesionServidor();
  if (!sesion) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  let body: { actual?: string; nueva?: string; confirmar?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Cuerpo invalido." }, { status: 400 });
  }

  const actual = String(body?.actual ?? "").trim();
  const nueva = String(body?.nueva ?? "").trim();
  const confirmar = String(body?.confirmar ?? "").trim();

  if (!actual || !nueva || !confirmar) {
    return NextResponse.json({ error: "Completá todos los campos." }, { status: 400 });
  }
  if (nueva !== confirmar) {
    return NextResponse.json({ error: "La nueva contraseña y la confirmación no coinciden." }, { status: 400 });
  }
  if (nueva.length < MIN_NUEVA) {
    return NextResponse.json(
      { error: `La nueva contraseña debe tener al menos ${MIN_NUEVA} caracteres.` },
      { status: 400 },
    );
  }
  if (nueva === actual) {
    return NextResponse.json({ error: "La nueva contraseña debe ser distinta de la actual." }, { status: 400 });
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: sesion.sub },
    select: { id: true, usuario: true, passwordHash: true, activo: true },
  });

  if (!usuario || !usuario.activo) {
    return NextResponse.json({ error: "Usuario no disponible." }, { status: 401 });
  }

  const jar = await cookies();
  const nestTok = jar.get(COOKIE_NEST_ACCESS)?.value;

  let cuentaNestVinculada = false;
  if (nestTok) {
    const nest = await fetchNestMeProfile(nestTok);
    if (nest.ok) {
      const emailNest = nest.profile.email.toLowerCase();
      const usuarioRow = usuario.usuario.trim().toLowerCase();
      cuentaNestVinculada = emailNest === usuarioRow;
    }
  }

  if (cuentaNestVinculada && nestTok) {
    const nestRes = await nestChangePassword(nestTok, actual, nueva);
    if (!nestRes.ok) {
      return NextResponse.json(
        {
          error:
            nestRes.message ||
            "No se pudo actualizar la contraseña de la cuenta del sitio. Verificá la contraseña actual.",
        },
        { status: 400 },
      );
    }
  } else {
    const claveEstudioOk = await bcrypt.compare(actual, usuario.passwordHash);
    if (!claveEstudioOk) {
      return NextResponse.json(
        {
          error:
            "La contraseña actual no es correcta. Si entrás con la cuenta del sitio (email), usá esa misma clave aquí.",
        },
        { status: 400 },
      );
    }
  }

  const passwordHash = await bcrypt.hash(nueva, 10);
  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { passwordHash },
  });

  return NextResponse.json({
    ok: true,
    message: cuentaNestVinculada
      ? "Contraseña actualizada en el sitio y en el módulo estudio."
      : "Contraseña actualizada correctamente.",
  });
}
