import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Routes that require authentication
const PROTECTED_PREFIXES = ["/dashboard", "/app", "/billing"];
const AUTH_PAGE_PATHS = new Set(["/login", "/signup"]);

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isSessionAware(pathname: string): boolean {
  return isProtected(pathname) || AUTH_PAGE_PATHS.has(pathname);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isSessionAware(pathname)) {
    return NextResponse.next();
  }

  // Refresh the Supabase session on every request (keeps auth cookie alive)
  const { supabaseResponse, user } = await updateSession(request);

  // Redirect unauthenticated users away from protected routes
  if (isProtected(pathname) && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth pages to the dashboard
  if (user && AUTH_PAGE_PATHS.has(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static      (static files)
     * - _next/image       (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     * - api/webhooks      (Stripe webhooks — updateSession() is wasteful here
     *                      and adds latency to the webhook response path)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|api/webhooks).*)",
  ],
};
