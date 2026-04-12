/**
 * POST /api/webhooks/stripe
 *
 * Stripe webhook handler. Verifies signature, then upserts subscription
 * state in Prisma for each billing lifecycle event.
 *
 * Security: webhook signature verification is mandatory. Any request that
 * fails signature verification is rejected with 400. Do not remove this check.
 *
 * Idempotency: all DB operations use upsert/update keyed on stable IDs so
 * that duplicate webhook deliveries produce the same result.
 *
 * Note (Stripe API 2026-03-25.dahlia): current_period_start/end moved from
 * Subscription to SubscriptionItem. Read from items.data[0] for period dates.
 */
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { serverEnv } from "@/lib/env";
import { prisma } from "@client/database/client";
import { SubscriptionStatus } from "@prisma/client";

// Required by Next.js to access raw body for Stripe signature verification
export const runtime = "nodejs";

/** Map Stripe subscription status → our SubscriptionStatus enum */
function toSubscriptionStatus(
  stripeStatus: Stripe.Subscription["status"],
): SubscriptionStatus {
  switch (stripeStatus) {
    case "active":
      return SubscriptionStatus.ACTIVE;
    case "canceled":
      return SubscriptionStatus.CANCELED;
    case "past_due":
      return SubscriptionStatus.PAST_DUE;
    case "trialing":
      return SubscriptionStatus.TRIALING;
    case "incomplete":
    case "incomplete_expired":
    case "unpaid":
    case "paused":
      return SubscriptionStatus.INCOMPLETE;
  }
}

/**
 * Extract period dates from a subscription.
 *
 * Stripe API 2026-03-25.dahlia moved current_period_start/end from the
 * Subscription root to each SubscriptionItem. Fall back to billing_cycle_anchor
 * for currentPeriodStart when no items exist (edge case).
 */
function getPeriodDates(subscription: Stripe.Subscription): {
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
} {
  const item = subscription.items.data[0];
  if (item) {
    return {
      currentPeriodStart: new Date(item.current_period_start * 1000),
      currentPeriodEnd: new Date(item.current_period_end * 1000),
    };
  }
  // Fallback: use billing_cycle_anchor (start) and estimate end as +1 month
  const start = new Date(subscription.billing_cycle_anchor * 1000);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  return { currentPeriodStart: start, currentPeriodEnd: end };
}

/** Upsert subscription record from a Stripe Subscription object */
async function syncSubscription(
  subscription: Stripe.Subscription,
): Promise<void> {
  // userId is stored in subscription metadata at checkout creation time
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.warn(
      `[stripe-webhook] subscription ${subscription.id} missing userId metadata — skipping sync`,
    );
    return;
  }

  const priceId = subscription.items.data[0]?.price?.id ?? "";
  const { currentPeriodStart, currentPeriodEnd } = getPeriodDates(subscription);

  await prisma.subscription.upsert({
    where: { stripeSubscriptionId: subscription.id },
    create: {
      userId,
      stripeCustomerId: subscription.customer as string,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      status: toSubscriptionStatus(subscription.status),
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
    update: {
      stripePriceId: priceId,
      status: toSubscriptionStatus(subscription.status),
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });
}

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.text();
  const headersList = await headers();
  const sig = headersList.get("stripe-signature");

  if (!sig) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 },
    );
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      sig,
      serverEnv.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[stripe-webhook] signature verification failed: ${message}`);
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${message}` },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        // If the session has a subscription, fetch full details and sync
        if (session.subscription) {
          const subscription = await getStripe().subscriptions.retrieve(
            session.subscription as string,
          );
          // Propagate userId from session metadata to subscription metadata
          if (session.metadata?.userId && !subscription.metadata?.userId) {
            await getStripe().subscriptions.update(subscription.id, {
              metadata: { userId: session.metadata.userId },
            });
            subscription.metadata.userId = session.metadata.userId;
          }
          await syncSubscription(subscription);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await syncSubscription(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: { status: SubscriptionStatus.CANCELED },
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        // In Stripe API 2026-03-25.dahlia, subscription ID is nested under parent.
        const subId =
          invoice.parent?.subscription_details?.subscription;
        if (subId) {
          await prisma.subscription.updateMany({
            where: { stripeSubscriptionId: subId as string },
            data: { status: SubscriptionStatus.PAST_DUE },
          });
        }
        break;
      }

      default:
        // Acknowledge unhandled events — do not return non-2xx or Stripe will retry
        break;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(
      `[stripe-webhook] error processing event ${event.type}: ${message}`,
    );
    // Return 500 so Stripe retries the event
    return NextResponse.json(
      { error: "Webhook handler error" },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
