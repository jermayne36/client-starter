import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Capture 100% of transactions in development; tune down in production
  tracesSampleRate: 1.0,

  // Only capture errors in production builds
  enabled: process.env.NODE_ENV === "production",

  debug: false,
});
