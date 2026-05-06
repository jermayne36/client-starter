// Validated environment variables — never access process.env directly
// Extend this file as you add new env vars

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optionalEnv(key: string): string | undefined {
  return process.env[key] || undefined;
}

// Public (client-side) env vars
export const env = {
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
  NEXT_PUBLIC_STRIPE_PRO_PRICE_ID: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID ?? "price_pro",
  NEXT_PUBLIC_STRIPE_PAYMENTLINK_FIRST10_LITE:
    process.env.NEXT_PUBLIC_STRIPE_PAYMENTLINK_FIRST10_LITE ?? "",
  NEXT_PUBLIC_STRIPE_PAYMENTLINK_FIRST10_STANDARD:
    process.env.NEXT_PUBLIC_STRIPE_PAYMENTLINK_FIRST10_STANDARD ?? "",
  NEXT_PUBLIC_STRIPE_PAYMENTLINK_FIRST10_PREMIUM:
    process.env.NEXT_PUBLIC_STRIPE_PAYMENTLINK_FIRST10_PREMIUM ?? "",
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN ?? "",
} as const;

// Server-only env vars — only import in server components / API routes
export const serverEnv = {
  get DATABASE_URL() { return requireEnv("DATABASE_URL"); },
  get DIRECT_URL() { return requireEnv("DIRECT_URL"); },
  get SUPABASE_SERVICE_ROLE_KEY() { return requireEnv("SUPABASE_SERVICE_ROLE_KEY"); },
  get STRIPE_SECRET_KEY() { return requireEnv("STRIPE_SECRET_KEY"); },
  get STRIPE_WEBHOOK_SECRET() { return requireEnv("STRIPE_WEBHOOK_SECRET"); },
  SENTRY_DSN: optionalEnv("SENTRY_DSN"),
  // Build-time only — used by withSentryConfig for source map upload in CI
  SENTRY_AUTH_TOKEN: optionalEnv("SENTRY_AUTH_TOKEN"),
  SENTRY_ORG: optionalEnv("SENTRY_ORG"),
  SENTRY_PROJECT: optionalEnv("SENTRY_PROJECT"),
} as const;
