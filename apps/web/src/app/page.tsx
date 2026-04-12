import Link from "next/link"
import { ArrowRight, Zap, Shield, BarChart3, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

const features = [
  {
    icon: Zap,
    title: "Fast by default",
    description:
      "Next.js 16 App Router with React Server Components. Only ship JavaScript that's needed.",
  },
  {
    icon: Shield,
    title: "Secure foundation",
    description:
      "Environment validation, type-safe API clients, and Supabase Auth ready to wire up.",
  },
  {
    icon: BarChart3,
    title: "Dashboard included",
    description:
      "Responsive sidebar layout with collapsible navigation — drop in your data and go.",
  },
  {
    icon: Layers,
    title: "Design system",
    description:
      "shadcn/ui components with a neutral, brandable theme. Change ~10 tokens to match any brand.",
  },
]

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main id="main" className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-background to-muted/30">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
            <div className="mx-auto max-w-3xl text-center">
              <Badge variant="secondary" className="mb-4">
                Ready to ship
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Your project, polished{" "}
                <span className="text-muted-foreground">from day one</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
                A production-ready Next.js starter with Tailwind CSS, shadcn/ui, dark mode, a
                responsive shell, and a dashboard layout — all wired up and ready for your content.
              </p>
              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Button size="lg" render={<Link href="/dashboard" />}>
                  Open dashboard
                  <ArrowRight className="ml-2 size-4" />
                </Button>
                <Button size="lg" variant="outline" render={<Link href="#features" />}>
                  See features
                </Button>
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

        {/* Features */}
        <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Everything included</h2>
            <p className="mt-4 text-muted-foreground">
              Stop configuring, start building. The foundation is done.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, description }) => (
              <Card key={title} className="border-border">
                <CardHeader className="pb-3">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="size-5 text-primary" />
                  </div>
                  <CardTitle className="text-base">{title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Ready to build?
              </h2>
              <p className="mt-4 text-muted-foreground">
                Open the dashboard to see the shell in action, or start customising the theme.
              </p>
              <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Button size="lg" render={<Link href="/dashboard" />}>
                  Go to dashboard
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
