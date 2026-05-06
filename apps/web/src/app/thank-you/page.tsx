import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"

type ThankYouPageProps = {
  searchParams: Promise<{
    tier?: string
    session_id?: string
  }>
}

const tierNames: Record<string, string> = {
  lite: "Lite",
  standard: "Standard",
  premium: "Premium",
}

export default async function ThankYouPage({ searchParams }: ThankYouPageProps) {
  const params = await searchParams
  const tierName = params.tier ? tierNames[params.tier] : undefined

  return (
    <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
        <CheckCircle2 className="size-6 text-primary" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight">Payment received</h1>
      <p className="mt-4 text-muted-foreground leading-relaxed">
        Your {tierName ? `${tierName} ` : ""}First 10 Users Evidence Pack checkout is complete.
        We will use the checkout details to connect your order to the intake workflow and follow up
        with next steps.
      </p>

      {params.session_id ? (
        <p className="mt-6 rounded-md border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          Checkout session: <span className="font-medium text-foreground">{params.session_id}</span>
        </p>
      ) : null}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button render={<Link href="/" />}>Back to the offer</Button>
        <Button variant="outline" render={<Link href="/refund" />}>
          Refund policy
        </Button>
      </div>
    </div>
  )
}
