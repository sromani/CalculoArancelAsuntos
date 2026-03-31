import { NextResponse } from "next/server";
import { COOKIE_NEST_ACCESS, COOKIE_SESSION, sessionCookieSecureForRequest } from "@/lib/auth-constants";

export async function POST(request: Request) {
  const secure = sessionCookieSecureForRequest(request);
  const clear = { httpOnly: true, path: "/", maxAge: 0, sameSite: "lax" as const, secure };
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_SESSION, "", clear);
  response.cookies.set(COOKIE_NEST_ACCESS, "", clear);
  return response;
}
