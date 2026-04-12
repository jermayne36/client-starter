import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Tune via env var; defaults to 10% to control costs in production
  tracesSampleRate: parseFloat(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? '0.1'),

  // Only capture errors in production builds
  enabled: process.env.NODE_ENV === "production",

  debug: false,
});
