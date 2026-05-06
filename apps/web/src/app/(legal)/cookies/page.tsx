export default function CookiesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">Cookie Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: May 6, 2026</p>

      <section className="mt-10 space-y-4">
        <p className="text-muted-foreground leading-relaxed">
          This Cookie Policy explains how Edukas Solutions LLC (&ldquo;we,&rdquo;
          &ldquo;us,&rdquo; or &ldquo;our&rdquo;) uses cookies and similar tracking
          technologies on this website and in our application. It should be read alongside our{" "}
          <a
            href="/privacy"
            className="text-foreground underline underline-offset-4 hover:opacity-80"
          >
            Privacy Policy
          </a>
          .
        </p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold">What Are Cookies?</h2>
        <p className="text-muted-foreground leading-relaxed">
          Cookies are small text files placed on your device when you visit a website. They are
          widely used to make websites work, to keep you signed in, and to gather information
          about how the site is used. Similar technologies — such as local storage and session
          storage — perform comparable functions and are covered by this policy.
        </p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold">Cookies We Use</h2>
        <p className="text-muted-foreground leading-relaxed">
          We use a small number of cookies and similar technologies, all of which are strictly
          necessary to deliver the Service or to keep it secure. We do not use advertising
          cookies, tracking pixels, or third-party retargeting cookies.
        </p>

        <h3 className="text-lg font-semibold mt-6">Authentication and Session</h3>
        <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
          <li>
            <strong className="text-foreground">Supabase Auth session cookies.</strong> Set by
            our authentication provider, Supabase, to keep you signed in across requests. These
            are required for any feature that depends on a logged-in account.
          </li>
        </ul>

        <h3 className="text-lg font-semibold mt-6">Payment and Fraud Prevention</h3>
        <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
          <li>
            <strong className="text-foreground">Stripe cookies.</strong> Set by Stripe on
            checkout and billing pages to process payments securely and to detect and prevent
            fraud. These cookies are governed by{" "}
            <a
              href="https://stripe.com/legal/cookies-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline underline-offset-4 hover:opacity-80"
            >
              Stripe&apos;s cookie policy
            </a>
            .
          </li>
        </ul>

        <h3 className="text-lg font-semibold mt-6">Hosting and Diagnostics</h3>
        <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
          <li>
            <strong className="text-foreground">Vercel hosting cookies.</strong> Our hosting
            provider, Vercel, may set cookies to route traffic, support deployments, and
            mitigate abuse. See{" "}
            <a
              href="https://vercel.com/legal/cookie-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline underline-offset-4 hover:opacity-80"
            >
              Vercel&apos;s cookie policy
            </a>
            .
          </li>
          <li>
            <strong className="text-foreground">Sentry error tracking.</strong> When the
            application encounters an error, Sentry collects diagnostic information to help us
            fix the problem. Sentry may use a session-scoped identifier to correlate related
            errors. See{" "}
            <a
              href="https://sentry.io/privacy/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline underline-offset-4 hover:opacity-80"
            >
              Sentry&apos;s privacy notice
            </a>
            .
          </li>
        </ul>

        <h3 className="text-lg font-semibold mt-6">Preference and Theme</h3>
        <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
          <li>
            <strong className="text-foreground">Theme preference.</strong> We store your
            light/dark theme preference in browser storage so the application remembers your
            choice between visits. This is set locally on your device and is not transmitted
            back to us.
          </li>
        </ul>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold">Third-Party Cookies</h2>
        <p className="text-muted-foreground leading-relaxed">
          Some of the cookies described above are set by third parties (Stripe, Supabase,
          Vercel, Sentry) when their services run on our pages. We do not control these
          cookies; they are governed by the providers&apos; own policies, linked above.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          We do not use Google Analytics, advertising networks, social media tracking pixels,
          or third-party retargeting cookies on this site.
        </p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold">How to Control Cookies</h2>
        <p className="text-muted-foreground leading-relaxed">
          You can control cookies through your browser settings. Most browsers let you block
          all cookies, block third-party cookies, or delete cookies after each session. Useful
          links:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
          <li>
            <a
              href="https://support.google.com/chrome/answer/95647"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline underline-offset-4 hover:opacity-80"
            >
              Manage cookies in Chrome
            </a>
          </li>
          <li>
            <a
              href="https://support.mozilla.org/en-US/kb/clear-cookies-and-site-data-firefox"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline underline-offset-4 hover:opacity-80"
            >
              Manage cookies in Firefox
            </a>
          </li>
          <li>
            <a
              href="https://support.apple.com/en-us/HT201265"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline underline-offset-4 hover:opacity-80"
            >
              Manage cookies in Safari
            </a>
          </li>
          <li>
            <a
              href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline underline-offset-4 hover:opacity-80"
            >
              Manage cookies in Microsoft Edge
            </a>
          </li>
        </ul>
        <p className="text-muted-foreground leading-relaxed">
          Blocking strictly necessary cookies — including authentication, payment, and hosting
          cookies — will break parts of the Service. You will not be able to sign in or
          complete a purchase without them.
        </p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold">Changes to This Policy</h2>
        <p className="text-muted-foreground leading-relaxed">
          We may update this Cookie Policy from time to time. When we do, we will update the
          &ldquo;Last updated&rdquo; date at the top of this page. If our use of cookies
          changes materially — for example, if we begin using analytics cookies — we will
          update this page and notify active users where required.
        </p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold">Contact Us</h2>
        <p className="text-muted-foreground leading-relaxed">
          Questions about our use of cookies? Email{" "}
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
