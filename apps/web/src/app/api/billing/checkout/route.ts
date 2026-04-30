/**
 * POST /api/billing/checkout
 *
 * Creates a Stripe Checkout Session for subscription purchase.
 * Returns the checkout URL for client-side redirect.
 *
 * Authentication: requires valid Supabase session.
 * Rate limiting: apply at the infrastructure level (Vercel Edge Config / middleware).
 */
import { NextResponse } from "next/server";
import { createCheckoutSession } from "@/lib/stripe";
import { requireUser } from "@/lib/auth";
import { prisma } from "@client/database/client";
import { env } from "@/lib/env";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<NextResponse> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let priceId: string;
  try {
    const body = (await request.json()) as { priceId?: unknown };
    if (typeof body.priceId !== "string" || !body.priceId) {
      return NextResponse.json(
        { error: "priceId is required" },
        { status: 400 },
      );
    }
    priceId = body.priceId;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Look up the internal user record to get their ID for metadata
  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: { id: true, email: true },
  });

  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  try {
    const baseUrl = env.NEXT_PUBLIC_APP_URL;
    const session = await createCheckoutSession({
      priceId,
      userId: dbUser.id,
      email: dbUser.email,
      successUrl: `${baseUrl}/billing?success=true`,
      cancelUrl: `${baseUrl}/billing?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[billing/checkout] Stripe error: ${message}`);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 502 },
    );
  }
}
