export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: May 6, 2026</p>

      <section className="mt-10 space-y-4">
        <p className="text-muted-foreground leading-relaxed">
          This Privacy Policy describes how Edukas Solutions LLC (&ldquo;Edukas Solutions,&rdquo;
          &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) collects, uses, and protects
          information in connection with our productized services and the websites, applications,
          and tools we operate. Please read it carefully.
        </p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold">Who We Are</h2>
        <p className="text-muted-foreground leading-relaxed">
          Edukas Solutions LLC is a Delaware-registered software and consulting company with
          operations based in West Hollywood, California. We deliver productized service packages
          (including the First 10 Users offering) along with consulting engagements and software
          products.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Registered mailing address:</strong> 8605 Santa
          Monica Blvd #875080, West Hollywood, CA 90069, USA
        </p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold">Information We Collect</h2>
        <p className="text-muted-foreground leading-relaxed">
          What we collect depends on whether you are a website visitor, a prospective client, an
          active engagement client, or a registered user of our application.
        </p>
        <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
          <li>
            <strong className="text-foreground">Inquiry and contact information.</strong> When
            you email us or submit a contact form, we collect the contact details and the
            content of your message.
          </li>
          <li>
            <strong className="text-foreground">Account information.</strong> When you create an
            account, we collect your email address and any profile details you provide. We use
            Supabase Auth to manage your sign-in.
          </li>
          <li>
            <strong className="text-foreground">Engagement and intake data.</strong> Under a
            signed Statement of Work, we receive working files, source data, business
            information, and other materials your project depends on. The categories of data and
            handling rules are governed by your SOW and any data processing addendum we sign with
            you.
          </li>
          <li>
            <strong className="text-foreground">Payment information.</strong> Payments are
            processed by Stripe. We never see or store your full card number, CVV, or bank
            account details. Stripe handles all payment data on its PCI-DSS compliant
            infrastructure. We retain billing history — invoice number, amount, date, payment
            status — for our financial records.
          </li>
          <li>
            <strong className="text-foreground">Diagnostic and error data.</strong> We use Sentry
            to capture application errors and performance traces so we can diagnose and fix
            problems. This may include device, browser, and request metadata associated with the
            error.
          </li>
        </ul>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold">How We Use Your Information</h2>
        <p className="text-muted-foreground leading-relaxed">
          We use the information we collect to:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
          <li>
            Deliver the productized service or consulting engagement described in your order or
            signed Statement of Work
          </li>
          <li>Operate and maintain your account and the application you signed up for</li>
          <li>Process payments and refunds and maintain billing records</li>
          <li>Respond to your support requests and questions</li>
          <li>Diagnose, debug, and improve the reliability of the service</li>
          <li>Detect and prevent fraud or abuse</li>
          <li>Comply with legal, tax, and accounting obligations</li>
        </ul>
        <p className="text-muted-foreground leading-relaxed">
          We do not sell your personal data. We do not use your data to build advertising
          profiles or transfer it to data brokers.
        </p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold">Third-Party Services We Use</h2>
        <p className="text-muted-foreground leading-relaxed">
          We rely on the following providers to operate our service. Each provider has its own
          privacy policy.
        </p>
        <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
          <li>
            <strong className="text-foreground">Stripe</strong> — payment processing.{" "}
            <a
              href="https://stripe.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline underline-offset-4 hover:opacity-80"
            >
              stripe.com/privacy
            </a>
          </li>
          <li>
            <strong className="text-foreground">Supabase</strong> — database hosting and
            authentication.{" "}
            <a
              href="https://supabase.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline underline-offset-4 hover:opacity-80"
            >
              supabase.com/privacy
            </a>
          </li>
          <li>
            <strong className="text-foreground">Vercel</strong> — application hosting.{" "}
            <a
              href="https://vercel.com/legal/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline underline-offset-4 hover:opacity-80"
            >
              vercel.com/legal/privacy-policy
            </a>
          </li>
          <li>
            <strong className="text-foreground">Sentry</strong> — error tracking and performance
            monitoring.{" "}
            <a
              href="https://sentry.io/privacy/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline underline-offset-4 hover:opacity-80"
            >
              sentry.io/privacy
            </a>
          </li>
        </ul>
        <p className="text-muted-foreground leading-relaxed">
          Edukas Solutions LLC does not itself currently hold SOC 2, ISO 27001, HIPAA, or
          PCI-DSS certifications. Where applicable, our providers&apos; certifications support
          the technical controls we rely on.
        </p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold">Data Retention</h2>
        <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
          <li>
            <strong className="text-foreground">Inquiry data.</strong> Contact form submissions
            and inbound email are retained for up to 24 months, after which they are archived or
            deleted unless they are part of an active client relationship.
          </li>
          <li>
            <strong className="text-foreground">Engagement data.</strong> Retained for the
            duration of the engagement and for the period specified in the signed SOW. Working
            files and source materials provided by the client are returned or destroyed at
            engagement close per the SOW&apos;s data return clause.
          </li>
          <li>
            <strong className="text-foreground">Account data.</strong> Retained for as long as
            your account is active. If you delete your account, we purge your personal data
            within 90 days, except where we are required to retain specific records for legal or
            financial compliance.
          </li>
          <li>
            <strong className="text-foreground">Billing and tax records.</strong> Retained for
            seven years to satisfy US tax and accounting obligations.
          </li>
        </ul>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold">Security</h2>
        <p className="text-muted-foreground leading-relaxed">
          Data is encrypted in transit using TLS and at rest by our database and hosting
          infrastructure (Supabase, Vercel). We limit access to personal data to team members
          who need it to deliver the service, and we rotate production credentials when team
          members change roles or leave the engagement. No system is perfectly secure, and we
          cannot guarantee that data transmitted to or from us will not be intercepted or
          accessed without authorization.
        </p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold">Your Rights</h2>
        <p className="text-muted-foreground leading-relaxed">
          Depending on where you live, you may have certain rights over your personal data,
          including:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
          <li>
            <strong className="text-foreground">Access</strong> — request a copy of the data we
            hold about you
          </li>
          <li>
            <strong className="text-foreground">Correction</strong> — ask us to correct
            inaccurate data
          </li>
          <li>
            <strong className="text-foreground">Deletion</strong> — request deletion of your
            account and associated data
          </li>
          <li>
            <strong className="text-foreground">Portability</strong> — request your data in a
            portable format
          </li>
        </ul>
        <p className="text-muted-foreground leading-relaxed">
          <strong className="text-foreground">California residents (CCPA/CPRA).</strong> You
          have the right to know what personal information we collect, the right to delete it,
          the right to correct it, and the right to opt out of the sale or sharing of personal
          information. We do not sell or share personal information for cross-context
          behavioral advertising.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          <strong className="text-foreground">EU, EEA, and UK residents (GDPR/UK GDPR).</strong>{" "}
          You have the rights listed above, plus the right to object to or restrict processing,
          the right to withdraw consent, and the right to lodge a complaint with your local
          data protection authority.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          To exercise any of these rights, email{" "}
          <a
            href="mailto:support@yourdomain.com"
            className="text-foreground underline underline-offset-4 hover:opacity-80"
          >
            support@yourdomain.com
          </a>
          . We will respond within 30 days. We may need to verify your identity before
          fulfilling the request.
        </p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold">International Data Transfers</h2>
        <p className="text-muted-foreground leading-relaxed">
          Our infrastructure is hosted in the United States. If you are located outside the US,
          your data will be transferred to and processed in the US. For clients in the EU, EEA,
          and UK, we rely on Standard Contractual Clauses (SCCs) and equivalent safeguards
          where applicable. Engagement-specific transfer terms can be addressed in your SOW or
          a separate Data Processing Addendum.
        </p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold">Cookies and Tracking</h2>
        <p className="text-muted-foreground leading-relaxed">
          See our{" "}
          <a
            href="/cookies"
            className="text-foreground underline underline-offset-4 hover:opacity-80"
          >
            Cookie Policy
          </a>{" "}
          for details on the cookies and similar technologies we use.
        </p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold">Children</h2>
        <p className="text-muted-foreground leading-relaxed">
          Our services are not directed to children under the age of 13, or under the age of 16
          for users in the European Economic Area. We do not knowingly collect personal data
          from children below these ages. If you believe a child has provided us with personal
          information, contact us and we will delete it promptly.
        </p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold">Changes to This Policy</h2>
        <p className="text-muted-foreground leading-relaxed">
          We may update this Privacy Policy from time to time. When we do, we will update the
          &ldquo;Last updated&rdquo; date at the top of this page. For material changes — those
          that significantly affect how we use your data — we will notify active users by email.
          Continued use of our services after changes take effect constitutes acceptance of the
          updated policy.
        </p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold">Contact Us</h2>
        <p className="text-muted-foreground leading-relaxed">
          If you have questions about this Privacy Policy or how we handle your data, contact
          us:
        </p>
        <address className="not-italic text-muted-foreground leading-relaxed">
          <p className="text-foreground font-medium">Edukas Solutions LLC</p>
          <p>8605 Santa Monica Blvd #875080</p>
          <p>West Hollywood, CA 90069</p>
          <p>United States</p>
          <p className="mt-2">
            Email:{" "}
            <a
              href="mailto:support@yourdomain.com"
              className="text-foreground underline underline-offset-4 hover:opacity-80"
            >
              support@yourdomain.com
            </a>
          </p>
        </address>
      </section>
    </div>
  )
}
