import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  FileSearch,
  Wrench,
  ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Owner replaces this URL after Lily delivers the Tally intake form
const INTAKE_FORM_URL = "https://tally.so/r/PLACEHOLDER"

export const metadata: Metadata = {
  title: "Automation Cleanup Audit",
  description:
    "Broken automations slow your business down and erode team trust. Our Automation Cleanup Audit scores every workflow in your stack, identifies the brittle steps, and hands you a prioritised repair plan — or we fix it for you.",
  openGraph: {
    title: "Automation Cleanup Audit | ClientStarter",
    description:
      "Score your automations, surface the brittle steps, get a prioritised repair plan. Quick Audit from $500.",
    images: [{ url: "/marketing/automation-cleanup-hero.svg", width: 1200, height: 630 }],
  },
}

const tiers = [
  {
    name: "Quick Audit",
    price: "$500–$1,500",
    highlight: false,
    description: "Understand what's broken and why.",
    bullets: [
      "Intake questionnaire review (12–15 questions)",
      "Scored diagnostic across all major workflows",
      "Brittle-step identification with severity ratings",
      "Written repair-plan document (3–5 quick fixes)",
      "30-min debrief call (PDT/PST)",
      "Delivered within 5 business days",
    ],
  },
  {
    name: "Standard Cleanup",
    price: "$3,000–$5,000",
    highlight: true,
    description: "Fix the highest-risk workflows yourself or with our guidance.",
    bullets: [
      "Everything in Quick Audit",
      "Full automation map (tools, triggers, owners, credentials)",
      "Credential and permission gap report",
      "Human-approval gate recommendations",
      "Error-handling and fallback design",
      "Priority repair implementation (up to 10 workflows)",
    ],
  },
  {
    name: "Premium Rebuild",
    price: "$9,500+",
    highlight: false,
    description: "Rebuild from the ground up on a resilient foundation.",
    bullets: [
      "Everything in Standard Cleanup",
      "Full re-architecture of automation stack",
      "Modular, documented workflow library",
      "Monitoring and alerting setup",
      "Team handoff training (up to 3 sessions)",
      "30-day post-launch support window",
    ],
  },
]

const steps = [
  {
    number: "01",
    icon: ClipboardList,
    title: "Submit intake",
    description:
      "Complete the 12–15 question intake form. Tell us which tools you run, how many automations you have, which ones are broken, and who owns each one.",
  },
  {
    number: "02",
    icon: FileSearch,
    title: "Receive scored repair plan",
    description:
      "We score every workflow across 8 dimensions — error handling, credential hygiene, owner accountability, human-approval gates, and more. You get a written plan with severity ratings and prioritised fixes.",
  },
  {
    number: "03",
    icon: Wrench,
    title: "Implement or escalate",
    description:
      "Take the repair plan to your team, or upgrade to Standard Cleanup or Premium Rebuild and let us handle it. No obligation to continue past the audit.",
  },
]

const faqs = [
  {
    q: "How long does delivery take per tier?",
    a: "Quick Audit: 5 business days PDT from completed intake. Standard Cleanup: 2–3 weeks depending on scope. Premium Rebuild: 4–8 weeks — scoped precisely after the Quick Audit findings.",
  },
  {
    q: "What counts as an 'automation' for the audit?",
    a: "Any workflow that runs without someone manually triggering every step. Zapier zaps, n8n flows, Make.com scenarios, Airtable automations, Notion automations, Slack workflows, custom scripts on a cron — all count. If it runs on a schedule or a trigger, it's in scope.",
  },
  {
    q: "What is NOT in scope?",
    a: "We do not build net-new automation infrastructure in a Quick Audit. We score and plan; we do not implement in the base tier. AI-powered automation discovery (API introspection, Zapier task history scraping) is explicitly out of scope for Phase 0. Enterprise CRM or ERP integrations (Salesforce, SAP, NetSuite) require a custom scoping call before pricing.",
  },
  {
    q: "Do you offer refunds?",
    a: "Refund policy placeholder — owner to confirm before launch. Our current posture: if the delivered repair plan does not address the workflows listed in your intake form, we revise at no charge until it does.",
  },
  {
    q: "We use a niche tool you may not know. Is that a problem?",
    a: "Probably not. Our rubric is tool-agnostic — we score the design of the workflow (trigger logic, error paths, credential ownership, fallback behaviour) regardless of the platform. We flag platform-specific risk as a separate line item.",
  },
  {
    q: "Can we start with a Quick Audit and then move to Standard Cleanup?",
    a: "Yes. The Quick Audit fee is credited toward any follow-on engagement closed within 30 days of delivery.",
  },
]

export default function AutomationCleanupPage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-background to-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <Badge variant="secondary" className="mb-4">
                ClientStarter Service
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Reclaim your{" "}
                <span className="text-muted-foreground">broken automations</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
                Silent failures. Missed triggers. Credentials no one owns. Our Automation Cleanup
                Audit scores every workflow in your stack, surfaces the brittle steps, and hands you
                a prioritised repair plan — in 5 business days PDT.
              </p>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Button size="lg" render={<Link href={INTAKE_FORM_URL} target="_blank" rel="noopener noreferrer" />}>
                  Book a Quick Audit ($500–$1,500)
                  <ArrowRight className="ml-2 size-4" />
                </Button>
                <Button size="lg" variant="outline" render={<Link href="#how-it-works" />}>
                  How it works
                </Button>
              </div>
            </div>
            <div className="relative hidden lg:block">
              <Image
                src="/marketing/automation-cleanup-hero.svg"
                alt="Abstract diagram showing tangled automation workflow paths on the left being transformed into clean, structured pipelines on the right"
                width={600}
                height={420}
                priority
                className="rounded-xl border border-border"
              />
              {/* TODO: Replace with gpt-image-2 production asset — see Hero Image TODO section in deliverable */}
            </div>
          </div>
        </div>

        {/* Decorative grid */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,transparent_60%,black)]"
        >
          <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-50" />
        </div>
      </section>

      {/* ── Pricing tiers ────────────────────────────────────────── */}
      <section id="pricing" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Choose your scope</h2>
          <p className="mt-4 text-muted-foreground">
            Start with a Quick Audit. Escalate only if the findings warrant it.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {tiers.map((tier) => (
            <Card
              key={tier.name}
              aria-label={`${tier.name}: ${tier.price}`}
              className={
                tier.highlight
                  ? "border-primary/40 bg-primary/5 relative"
                  : "border-border"
              }
            >
              {tier.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge>Most popular</Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-lg">{tier.name}</CardTitle>
                <div className="mt-2">
                  <span className="text-3xl font-bold">{tier.price}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{tier.description}</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5 text-sm text-muted-foreground" aria-label={`${tier.name} deliverables`}>
                  {tier.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2">
                      <CheckCircle2
                        className="mt-0.5 size-4 shrink-0 text-primary"
                        aria-hidden="true"
                      />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  <Button
                    className="w-full"
                    variant={tier.highlight ? "default" : "outline"}
                    render={<Link href={INTAKE_FORM_URL} target="_blank" rel="noopener noreferrer" />}
                  >
                    {tier.name === "Quick Audit" ? "Book a Quick Audit" : `Start with ${tier.name}`}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Prices are ranges. Final quote is fixed after intake review.{" "}
          <span className="font-medium text-foreground">
            Quick Audit fee credited toward any follow-on engagement closed within 30 days.
          </span>
        </p>
      </section>

      {/* ── How it works ─────────────────────────────────────────── */}
      <section
        id="how-it-works"
        className="border-t border-border bg-muted/30"
        aria-labelledby="how-it-works-heading"
      >
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 id="how-it-works-heading" className="text-3xl font-bold tracking-tight sm:text-4xl">
              How it works
            </h2>
            <p className="mt-4 text-muted-foreground">
              Three steps. No ambiguity. No surprise scope.
            </p>
          </div>

          <ol className="grid gap-8 sm:grid-cols-3" aria-label="Process steps">
            {steps.map(({ number, icon: Icon, title, description }) => (
              <li key={number} className="relative flex flex-col">
                <div className="mb-4 flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"
                    aria-hidden="true"
                  >
                    <Icon className="size-5 text-primary" />
                  </div>
                  <span className="text-xs font-mono font-bold text-muted-foreground tracking-widest">
                    {number}
                  </span>
                </div>
                <h3 className="mb-2 text-lg font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Social proof slot (empty — ready for testimonials) ───── */}
      <section
        className="border-t border-border"
        aria-labelledby="social-proof-heading"
      >
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <h2 id="social-proof-heading" className="mb-8 text-center text-3xl font-bold tracking-tight sm:text-4xl">
            What clients say
          </h2>
          {/* Placeholder — owner to replace with real testimonials after first paid engagements */}
          <figure
            aria-hidden="true"
            className="mx-auto max-w-2xl rounded-xl border border-dashed border-border bg-muted/30 p-10 text-center"
          >
            <p className="text-sm text-muted-foreground italic">
              Client testimonials will appear here after the first paid engagements.
            </p>
            <figcaption className="mt-4 text-xs text-muted-foreground/60">
              {/* TODO from lily-clientstarter-mvp: replace with verified client quotes */}
            </figcaption>
          </figure>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────── */}
      <section
        className="border-t border-border bg-muted/30"
        aria-labelledby="faq-heading"
      >
        <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
          <h2 id="faq-heading" className="mb-12 text-center text-3xl font-bold tracking-tight sm:text-4xl">
            Frequently asked questions
          </h2>

          <dl className="space-y-6">
            {faqs.map(({ q, a }) => (
              <div
                key={q}
                className="rounded-lg border border-border bg-background p-6"
              >
                <dt className="flex items-start gap-3">
                  <ChevronDown
                    className="mt-0.5 size-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <span className="font-semibold text-sm">{q}</span>
                </dt>
                <dd className="mt-3 pl-7 text-sm text-muted-foreground leading-relaxed">{a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────── */}
      <section className="border-t border-border" aria-labelledby="final-cta-heading">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 id="final-cta-heading" className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to stop guessing which automation will break next?
            </h2>
            <p className="mt-4 text-muted-foreground">
              Book a Quick Audit. Know your risk profile in 5 business days PDT.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button
                size="lg"
                render={<Link href={INTAKE_FORM_URL} target="_blank" rel="noopener noreferrer" />}
              >
                Book a Quick Audit ($500–$1,500)
                <ArrowRight className="ml-2 size-4" />
              </Button>
              <Button size="lg" variant="outline" render={<Link href="/services" />}>
                View all ClientStarter services
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
