import { jwtVerify } from "jose";

export type NestAccessPayload = {
  sub: string;
  email: string;
};

/**
 * Valida el JWT emitido por el API Nest (escribanos-api), misma clave que JWT_SECRET.
 */
export async function verifyNestAccessToken(token: string): Promise<NestAccessPayload | null> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET?.trim() || "your-secret-key");
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
    const sub = payload.sub;
    const email = payload.email;
    if (typeof sub !== "string" || typeof email !== "string") {
      return null;
    }
    return { sub, email: email.toLowerCase() };
  } catch {
    return null;
  }
}
