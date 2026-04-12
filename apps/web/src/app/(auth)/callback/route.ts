import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@client/database/client";

// OAuth callback handler — exchanges the `code` query param for a session.
// Supabase redirects here after Google OAuth or email confirmation flows.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // `next` allows callers to specify a post-auth redirect destination
  const next = searchParams.get("next") ?? "/dashboard";

  if (!code) {
    // No code present — malformed callback, redirect to login with error
    return NextResponse.redirect(
      `${origin}/login?error=missing_code`,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] code exchange failed:", error.message);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`,
    );
  }

  // Sync Prisma user record directly — the session is now active on the supabase
  // client so getUser() returns the freshly-authenticated user. A self-HTTP fetch
  // would forward stale pre-exchange cookies and get a 401.
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.email) {
      const name: string | null =
        (user.user_metadata?.name as string | undefined) ??
        (user.user_metadata?.full_name as string | undefined) ??
        null;
      const avatarUrl: string | null =
        (user.user_metadata?.avatar_url as string | undefined) ??
        (user.user_metadata?.picture as string | undefined) ??
        null;
      const emailVerified =
        user.email_confirmed_at != null || user.confirmed_at != null;

      await prisma.user.upsert({
        where: { supabaseId: user.id },
        update: { email: user.email, name, avatarUrl, emailVerified },
        create: {
          supabaseId: user.id,
          email: user.email,
          name,
          avatarUrl,
          emailVerified,
        },
      });
    }
  } catch (syncError) {
    // Sync failure is non-fatal — the user is authenticated, sync retries on next request
    console.error("[auth/callback] user sync failed:", syncError);
  }

  // Relative redirect — preserves the current domain (handles preview deployments)
  return NextResponse.redirect(`${origin}${next}`);
}
