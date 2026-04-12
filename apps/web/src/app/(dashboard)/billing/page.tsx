"use client"

/**
 * /billing — Billing & Subscription management page.
 *
 * Shows current plan, upgrade CTA (→ Stripe Checkout), and manage button
 * (→ Stripe Customer Portal). Reads subscription status via the API route
 * so no Stripe SDK is imported on the client.
 */
import * as React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CreditCard, Zap, CheckCircle2, AlertTriangle } from "lucide-react"

// The price ID for the Pro plan — replace with your actual Stripe Price ID
const PRO_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID ?? "price_pro"

type SubscriptionStatus =
  | "ACTIVE"
  | "CANCELED"
  | "PAST_DUE"
  | "TRIALING"
  | "INCOMPLETE"

interface Subscription {
  id: string
  status: SubscriptionStatus
  stripePriceId: string
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function statusBadge(status: SubscriptionStatus) {
  switch (status) {
    case "ACTIVE":
    case "TRIALING":
      return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>
    case "PAST_DUE":
      return <Badge variant="destructive">Past due</Badge>
    case "CANCELED":
      return <Badge variant="secondary">Canceled</Badge>
    case "INCOMPLETE":
      return <Badge variant="outline" className="text-amber-600 border-amber-400">Incomplete</Badge>
  }
}

export default function BillingPage() {
  const [subscription, setSubscription] = React.useState<Subscription | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [checkoutLoading, setCheckoutLoading] = React.useState(false)
  const [portalLoading, setPortalLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function fetchSubscription() {
      try {
        const res = await fetch("/api/billing/subscription")
        if (!res.ok) throw new Error("Failed to fetch subscription")
        const data = (await res.json()) as { subscription: Subscription | null }
        setSubscription(data.subscription)
      } catch {
        setError("Unable to load subscription details.")
      } finally {
        setLoading(false)
      }
    }
    void fetchSubscription()
  }, [])

  async function handleUpgrade() {
    setCheckoutLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: PRO_PRICE_ID }),
      })
      if (!res.ok) throw new Error("Failed to create checkout session")
      const data = (await res.json()) as { url: string }
      if (data.url) window.location.href = data.url
    } catch {
      setError("Unable to start checkout. Please try again.")
    } finally {
      setCheckoutLoading(false)
    }
  }

  async function handleManage() {
    setPortalLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" })
      if (!res.ok) throw new Error("Failed to create portal session")
      const data = (await res.json()) as { url: string }
      if (data.url) window.location.href = data.url
    } catch {
      setError("Unable to open billing portal. Please try again.")
    } finally {
      setPortalLoading(false)
    }
  }

  const isPro =
    subscription?.status === "ACTIVE" || subscription?.status === "TRIALING"

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your subscription and billing details.
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Current plan card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="size-5 text-muted-foreground" />
              <CardTitle>Current plan</CardTitle>
            </div>
            {!loading && subscription && statusBadge(subscription.status)}
          </div>
          <CardDescription>
            {loading
              ? "Loading your plan…"
              : isPro
                ? "You are on the Pro plan."
                : "You are on the Free plan."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {loading ? (
            <div className="h-16 animate-pulse rounded-md bg-muted" />
          ) : isPro && subscription ? (
            <>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Current period</p>
                  <p className="font-medium">
                    {formatDate(subscription.currentPeriodStart)} —{" "}
                    {formatDate(subscription.currentPeriodEnd)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Renewal</p>
                  <p className="font-medium">
                    {subscription.cancelAtPeriodEnd
                      ? "Cancels at period end"
                      : `Renews ${formatDate(subscription.currentPeriodEnd)}`}
                  </p>
                </div>
              </div>

              <Separator />

              <Button
                variant="outline"
                onClick={handleManage}
                disabled={portalLoading}
                className="w-full sm:w-auto"
              >
                <CreditCard className="mr-2 size-4" />
                {portalLoading ? "Opening portal…" : "Manage subscription"}
              </Button>
            </>
          ) : (
            <>
              {/* Free plan feature list */}
              <ul className="space-y-2 text-sm text-muted-foreground">
                {[
                  "Up to 5 projects",
                  "1 GB storage",
                  "Community support",
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-muted-foreground" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Separator />

              <Button
                onClick={handleUpgrade}
                disabled={checkoutLoading}
                className="w-full sm:w-auto"
              >
                <Zap className="mr-2 size-4" />
                {checkoutLoading ? "Redirecting…" : "Upgrade to Pro"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Pro plan features card (shown on free plan) */}
      {!loading && !isPro && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">Pro plan includes</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {[
                "Unlimited projects",
                "100 GB storage",
                "Priority support",
                "Advanced analytics",
                "Custom integrations",
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-primary" />
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
