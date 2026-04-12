import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@client/database/client";

/**
 * POST /api/auth/sync
 *
 * Creates or updates the Prisma `users` record for the currently
 * authenticated Supabase user. Called automatically from the OAuth
 * callback route after a successful code exchange.
 *
 * Authentication: session cookie (validated via supabase.auth.getUser)
 * Idempotent: safe to call multiple times — uses upsert keyed on supabaseId
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = user.email;
  if (!email) {
    return NextResponse.json(
      { error: "User has no email address" },
      { status: 422 },
    );
  }

  const name: string | null =
    (user.user_metadata?.name as string | undefined) ??
    (user.user_metadata?.full_name as string | undefined) ??
    null;

  const avatarUrl: string | null =
    (user.user_metadata?.avatar_url as string | undefined) ??
    (user.user_metadata?.picture as string | undefined) ??
    null;

  const emailVerified: boolean =
    user.email_confirmed_at != null || user.confirmed_at != null;

  try {
    const dbUser = await prisma.user.upsert({
      where: { supabaseId: user.id },
      update: {
        email,
        name,
        avatarUrl,
        emailVerified,
      },
      create: {
        supabaseId: user.id,
        email,
        name,
        avatarUrl,
        emailVerified,
      },
    });

    return NextResponse.json({ userId: dbUser.id }, { status: 200 });
  } catch (err) {
    console.error("[api/auth/sync] upsert failed:", err);
    return NextResponse.json(
      { error: "Failed to sync user record" },
      { status: 500 },
    );
  }
}
