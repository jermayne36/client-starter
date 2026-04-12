import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

// Server-side Supabase client — use in Server Components and Route Handlers
// Must be called inside an async function (cookies() requires an async context)
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // setAll is called from a Server Component — cookies can only be
            // set from middleware or Route Handlers. This catch is intentional
            // for RSC usage where session refresh happens via middleware instead.
          }
        },
      },
    },
  );
}
