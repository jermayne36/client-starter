/**
 * POST /api/billing/portal
 *
 * Creates a Stripe Customer Portal session for subscription management.
 * Returns the portal URL for client-side redirect.
 *
 * Authentication: requires valid Supabase session.
 * Requires: user must have an existing Stripe subscription (stripeCustomerId).
 */
import { NextResponse } from "next/server";
import { createBillingPortalSession } from "@/lib/stripe";
import { requireUser } from "@/lib/auth";
import { prisma } from "@client/database/client";
import { env } from "@/lib/env";

export const runtime = "nodejs";

export async function POST(): Promise<NextResponse> {
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
      subscription: { select: { stripeCustomerId: true } },
    },
  });

  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (!dbUser.subscription?.stripeCustomerId) {
    return NextResponse.json(
      { error: "No active subscription found" },
      { status: 404 },
    );
  }

  try {
    const baseUrl = env.NEXT_PUBLIC_APP_URL;
    const session = await createBillingPortalSession({
      stripeCustomerId: dbUser.subscription.stripeCustomerId,
      returnUrl: `${baseUrl}/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[billing/portal] Stripe error: ${message}`);
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 502 },
    );
  }
}
