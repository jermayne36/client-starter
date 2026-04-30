/**
 * CORS header helper for API route responses.
 *
 * Usage in a Route Handler:
 *   import { withCors, handleCorsOptions } from "@/lib/cors";
 *
 *   export async function OPTIONS(request: Request) {
 *     return handleCorsOptions(request);
 *   }
 *
 *   export async function GET() {
 *     return withCors(NextResponse.json({ data: "..." }));
 *   }
 */
import { NextResponse } from "next/server";
import { env } from "@/lib/env";

/** Allowed origins — extend via CORS_ALLOWED_ORIGINS env var (comma-separated). */
function getAllowedOrigins(): string[] {
  const appUrl = env.NEXT_PUBLIC_APP_URL;
  const origins = [appUrl];

  // In development, also allow localhost variants
  if (appUrl.includes("localhost")) {
    origins.push("http://localhost:3000", "http://127.0.0.1:3000");
  }

  return origins;
}

function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  return getAllowedOrigins().includes(origin);
}

/** Add CORS headers to an existing NextResponse. */
export function withCors(
  response: NextResponse,
  request?: Request,
): NextResponse {
  const origin = request?.headers.get("origin") ?? null;
  const allowed = isOriginAllowed(origin);

  if (allowed && origin) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  }

  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  response.headers.set("Access-Control-Max-Age", "86400");

  return response;
}

/** Handle CORS preflight (OPTIONS) requests. */
export function handleCorsOptions(request: Request): NextResponse {
  const response = new NextResponse(null, { status: 204 });
  return withCors(response, request);
}
