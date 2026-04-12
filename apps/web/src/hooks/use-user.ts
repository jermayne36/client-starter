"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

interface UseUserResult {
  user: User | null;
  loading: boolean;
}

/**
 * Client-side hook — subscribe to the current Supabase auth state.
 *
 * Returns the user object from the local session cache (no network call).
 * The session is kept fresh by the Next.js middleware which runs on every
 * request and calls supabase.auth.getUser() server-side.
 *
 * Use this hook in Client Components. For Server Components, use
 * `getUser()` from `@/lib/auth` instead.
 */
export function useUser(): UseUserResult {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // Get the initial session synchronously from the cookie
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Subscribe to auth state changes (sign in, sign out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}
