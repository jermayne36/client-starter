import { createClient } from "@/lib/supabase/server";

/**
 * Server-side helper — get the currently authenticated Supabase user.
 *
 * Use in Server Components and Route Handlers.
 * Returns null if the request has no valid session.
 *
 * IMPORTANT: This calls supabase.auth.getUser() which validates the JWT
 * with Supabase servers on every invocation — it does NOT use the local
 * cookie value without verification (unlike getSession()).
 */
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user;
}

/**
 * Server-side helper — require an authenticated user.
 *
 * Throws if no session exists. Use in Route Handlers that must be
 * authenticated. For Server Components, use getUser() and handle null.
 */
export async function requireUser() {
  const user = await getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}
