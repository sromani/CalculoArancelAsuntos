import { NextRequest, NextResponse } from "next/server";
import { backendApiBaseUrl } from "@/lib/backend-api-url";

async function proxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  const { path } = await context.params;
  const segment = path?.join("/") ?? "";
  const target = `${backendApiBaseUrl()}/${segment}${request.nextUrl.search}`;

  const headers = new Headers(request.headers);
  for (const name of [
    "host",
    "connection",
    "keep-alive",
    "transfer-encoding",
    "upgrade",
    "expect",
    "proxy-connection",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailer",
  ]) {
    headers.delete(name);
  }

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  try {
    const upstream = await fetch(target, init);
    const responseHeaders = new Headers(upstream.headers);
    responseHeaders.delete("transfer-encoding");
    return new NextResponse(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("[nest-api proxy]", target, error);
    return NextResponse.json(
      { message: "El API Nest no responde.", error: "Bad Gateway" },
      { status: 502 },
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
