import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Capture 100% of transactions in development; tune down in production
  tracesSampleRate: 1.0,

  // Session replay: capture 10% of all sessions, 100% with errors
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration(),
  ],

  // Only capture errors in production builds
  enabled: process.env.NODE_ENV === "production",

  debug: false,
});
