/**
 * Stripe server-side utilities.
 * Import only in server components, API routes, and webhook handlers.
 * Never import in client components.
 *
 * The Stripe client is lazily initialized on first use to avoid calling
 * requireEnv() at module load time during Next.js build phase.
 */
import Stripe from "stripe";
import { serverEnv } from "@/lib/env";

let _stripe: Stripe | undefined;

/** Lazily initialize and return the Stripe client. */
export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(serverEnv.STRIPE_SECRET_KEY, {
      apiVersion: "2026-03-25.dahlia",
      typescript: true,
    });
  }
  return _stripe;
}

/**
 * Create a Stripe Checkout Session for subscription purchase.
 *
 * @param priceId    - Stripe Price ID for the plan
 * @param userId     - Internal user ID (stored in metadata for webhook lookup)
 * @param email      - Pre-fill the customer email
 * @param successUrl - Redirect URL on successful payment
 * @param cancelUrl  - Redirect URL if customer cancels
 */
export async function createCheckoutSession({
  priceId,
  userId,
  email,
  successUrl,
  cancelUrl,
}: {
  priceId: string;
  userId: string;
  email: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<Stripe.Checkout.Session> {
  return getStripe().checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: email,
    metadata: { userId },
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
    subscription_data: {
      metadata: { userId },
    },
  });
}

/**
 * Create a Stripe Billing Portal session so users can manage their subscription.
 *
 * @param stripeCustomerId - The customer's Stripe customer ID
 * @param returnUrl        - URL to return to after the portal session
 */
export async function createBillingPortalSession({
  stripeCustomerId,
  returnUrl,
}: {
  stripeCustomerId: string;
  returnUrl: string;
}): Promise<Stripe.BillingPortal.Session> {
  return getStripe().billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl,
  });
}

/**
 * Retrieve a Stripe subscription by ID.
 */
export async function getSubscription(
  subscriptionId: string,
): Promise<Stripe.Subscription> {
  return getStripe().subscriptions.retrieve(subscriptionId);
}
