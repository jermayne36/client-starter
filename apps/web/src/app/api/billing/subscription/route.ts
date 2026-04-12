/**
 * GET /api/billing/subscription
 *
 * Returns the current user's subscription status from the local database.
 * Uses the Prisma record (synced by webhooks) — does not call Stripe on
 * each request to avoid latency and rate limit issues.
 *
 * Authentication: requires valid Supabase session.
 */
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@client/database/client";

export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: {
      id: true,
      subscription: {
        select: {
          id: true,
          status: true,
          stripePriceId: true,
          currentPeriodStart: true,
          currentPeriodEnd: true,
          cancelAtPeriodEnd: true,
          createdAt: true,
        },
      },
    },
  });

  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    subscription: dbUser.subscription ?? null,
  });
}
