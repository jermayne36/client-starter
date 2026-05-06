export default function RefundPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">Refund Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: May 6, 2026</p>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold">Productized Service Refunds</h2>
        <p className="text-muted-foreground leading-relaxed">
          We stand behind every project we deliver. All productized service packages (including
          all tiers of our First 10 Users offering) come with a{" "}
          <strong className="text-foreground">7-day satisfaction guarantee</strong> from the
          date of final delivery.
        </p>
        <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
          <li>
            <strong className="text-foreground">Full refund</strong>: Requested within 7 days
            of delivery and before final acceptance is signed off.
          </li>
          <li>
            <strong className="text-foreground">Pro-rated partial refund</strong>: If work is
            partially delivered and you request a refund before project completion, you will
            receive a refund proportional to the undelivered portion of the scope.
          </li>
          <li>
            <strong className="text-foreground">No refund</strong>: Once final acceptance is
            signed off or the 7-day guarantee window has passed, whichever comes first, the
            purchase is non-refundable.
          </li>
        </ul>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold">Subscription Refunds</h2>
        <p className="text-muted-foreground leading-relaxed">
          For subscription plans, the following terms apply:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
          <li>
            <strong className="text-foreground">First billing cycle</strong>: If you are not
            satisfied within the first billing cycle, contact us for a full refund of that
            period.
          </li>
          <li>
            <strong className="text-foreground">Subsequent billing cycles</strong>: Charges
            for billing cycles after the first are non-refundable. You may cancel your
            subscription at any time; cancellation takes effect at the end of the current
            billing period.
          </li>
        </ul>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold">How to Request a Refund</h2>
        <p className="text-muted-foreground leading-relaxed">
          To request a refund, email us at{" "}
          <a
            href="mailto:support@yourdomain.com"
            className="text-foreground underline underline-offset-4 hover:opacity-80"
          >
            support@yourdomain.com
          </a>{" "}
          with your order details and the reason for your request. We will respond within{" "}
          <strong className="text-foreground">3 business days</strong>.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          Please include the following in your email:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
          <li>Your full name and account email address</li>
          <li>Order or invoice number</li>
          <li>Brief description of the issue or reason for the refund request</li>
        </ul>
        <p className="text-muted-foreground leading-relaxed">
          Approved refunds are processed to the original payment method within 5–10 business
          days, depending on your bank or card issuer.
        </p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold">Disputes</h2>
        <p className="text-muted-foreground leading-relaxed">
          If you are unsatisfied with our initial response, you may escalate your request by
          replying to the same email thread and requesting escalation. We are committed to
          resolving all disputes fairly and promptly.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          If you believe an unauthorized charge has occurred, please contact your card issuer
          directly. For any other billing concerns, reach us at{" "}
          <a
            href="mailto:support@yourdomain.com"
            className="text-foreground underline underline-offset-4 hover:opacity-80"
          >
            support@yourdomain.com
          </a>
          .
        </p>
      </section>
    </div>
  )
}
