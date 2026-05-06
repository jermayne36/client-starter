import Link from "next/link"
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileSpreadsheet,
  MessageSquareText,
  Search,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Footer } from "@/components/layout/footer"
import { Header } from "@/components/layout/header"
import { env } from "@/lib/env"

const proofPoints = [
  "Pain-thread sourcing before outreach",
  "ICP-fit scoring for every target",
  "Reply drafts grounded in public context",
  "A tracker you can keep using after delivery",
]

const deliverables = [
  {
    icon: Search,
    title: "Beachhead evidence",
    description:
      "We find reachable founder communities, score threads against your ICP, and keep only posts with visible buying or workflow pain.",
  },
  {
    icon: MessageSquareText,
    title: "Founder-voice drafts",
    description:
      "You get reply and DM drafts written for the specific thread, not generic outbound copy you have to rewrite from scratch.",
  },
  {
    icon: FileSpreadsheet,
    title: "Validation tracker",
    description:
      "Every lead, thread, score, rule gate, and next action lands in a clean CSV so you can post, reply, and follow up without losing context.",
  },
]

const tiers = [
  {
    key: "lite",
    name: "Lite",
    price: "$149",
    description:
      "For founders with a clear ICP who want a 48-hour evidence injection before they post.",
    href: env.NEXT_PUBLIC_STRIPE_PAYMENTLINK_FIRST10_LITE,
    cta: "Start with Lite",
    features: [
      "10 ICP-fit-scored threads",
      "5 personalized reply or DM drafts",
      "Validation tracker CSV",
      "Async-only delivery",
    ],
  },
  {
    key: "standard",
    name: "Standard",
    price: "$349",
    description:
      "For launches in the next 30 days that need a sourced target list, drafts, and one strategy conversation.",
    href: env.NEXT_PUBLIC_STRIPE_PAYMENTLINK_FIRST10_STANDARD,
    cta: "Start with Standard",
    popular: true,
    features: [
      "25 ICP-fit-scored threads",
      "10 personalized reply or DM drafts",
      "Subreddit rules gate",
      "30-minute strategy call or async Loom",
      "One ReelDeck proof clip",
    ],
  },
  {
    key: "premium",
    name: "Premium",
    price: "$500",
    description:
      "For founders who want a week of guided implementation while they post, DM, and reply.",
    href: env.NEXT_PUBLIC_STRIPE_PAYMENTLINK_FIRST10_PREMIUM,
    cta: "Start with Premium",
    features: [
      "Everything in Standard",
      "One week of reply triage",
      "Daily tracker updates",
      "Up to two mid-week tactic adjustments",
    ],
  },
]

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main id="main" className="flex-1">
        <section className="border-b border-border bg-background">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-24">
            <div className="flex flex-col justify-center">
              <Badge variant="secondary" className="mb-5 w-fit">
                First-user distribution evidence
              </Badge>
              <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                First 10 Users Evidence Pack
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
                We find where your best early users are already complaining, score the strongest
                threads, and hand you founder-voice drafts so you can start the right conversations.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" render={<Link href="#pricing" />}>
                  Pick a tier
                  <ArrowRight className="ml-2 size-4" />
                </Button>
                <Button size="lg" variant="outline" render={<Link href="#deliverables" />}>
                  See deliverables
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-5">
              <div className="rounded-md border border-border bg-background p-5">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Clock3 className="size-4 text-primary" />
                  48-hour Lite delivery window
                </div>
                <div className="mt-6 space-y-4">
                  {proofPoints.map((point) => (
                    <div key={point} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                      <p className="text-sm text-muted-foreground">{point}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="proof" className="border-b border-border">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-bold tracking-tight">Distribution before polish</h2>
              <p className="mt-4 text-muted-foreground">
                The pack is built for technical founders who can ship product but need better
                evidence about who to talk to first, what pain to lead with, and where outreach is
                welcome.
              </p>
            </div>
          </div>
        </section>

        <section id="deliverables" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-10 max-w-3xl">
            <h2 className="text-3xl font-bold tracking-tight">What you receive</h2>
            <p className="mt-4 text-muted-foreground">
              A compact evidence bundle you can act on immediately, without waiting for a new funnel
              build or analytics migration.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {deliverables.map(({ icon: Icon, title, description }) => (
              <Card key={title}>
                <CardHeader>
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                    <Icon className="size-5 text-primary" />
                  </div>
                  <CardTitle>{title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 text-muted-foreground">{description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="pricing" className="border-t border-border bg-muted/25">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="mb-10 max-w-3xl">
              <h2 className="text-3xl font-bold tracking-tight">Choose the right pack</h2>
              <p className="mt-4 text-muted-foreground">
                One ICP per pack. USD only at launch. Each tier routes through Stripe Payment Links.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {tiers.map((tier) => (
                <Card
                  key={tier.key}
                  className={
                    tier.popular ? "border-primary/50 bg-background shadow-sm" : "bg-background"
                  }
                >
                  <CardHeader>
                    <div className="flex items-center justify-between gap-3">
                      <CardTitle>{tier.name}</CardTitle>
                      {tier.popular ? <Badge>Most popular</Badge> : null}
                    </div>
                    <CardDescription>{tier.description}</CardDescription>
                    <div className="pt-4 text-4xl font-bold">{tier.price}</div>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <ul className="space-y-3 text-sm text-muted-foreground">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full"
                      variant={tier.popular ? "default" : "outline"}
                      render={<a href={tier.href || "#pricing"} />}
                    >
                      {tier.cta}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
