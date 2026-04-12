import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

  // Trigger Prisma user sync after successful authentication
  try {
    await fetch(`${origin}/api/auth/sync`, {
      method: "POST",
      headers: {
        // Forward the session cookies so the sync route can authenticate the user
        Cookie: request.headers.get("cookie") ?? "",
      },
    });
  } catch (syncError) {
    // Sync failure is non-fatal — the user is authenticated, sync retries on next request
    console.error("[auth/callback] user sync failed:", syncError);
  }

  // Relative redirect — preserves the current domain (handles preview deployments)
  return NextResponse.redirect(`${origin}${next}`);
}
