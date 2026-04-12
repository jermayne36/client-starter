# Environment Variables Reference

> Complete reference for every environment variable used by the client-starter application.
> Copy `.env.example` to `.env` and fill in values before running locally.

---

## Supabase (Database + Auth)

| Variable | Required | Server/Client | Where to Get It |
|----------|----------|---------------|-----------------|
| `DATABASE_URL` | Yes | Server | Supabase Dashboard → Settings → Database → Connection String (Pooler, port 6543). Append `?pgbouncer=true`. |
| `DIRECT_URL` | Yes | Server | Same as above but port 5432 (direct, no pooler). Used by Prisma for migrations only. |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Client | Supabase Dashboard → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Client | Supabase Dashboard → Settings → API → `anon` `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server | Supabase Dashboard → Settings → API → `service_role` key. **Never expose to client.** |

### Format Examples

```bash
DATABASE_URL="postgresql://postgres.[project-ref]:password@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[project-ref]:password@aws-0-[region].pooler.supabase.com:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://[project-ref].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."
```

---

## Stripe (Payments)

| Variable | Required | Server/Client | Where to Get It |
|----------|----------|---------------|-----------------|
| `STRIPE_SECRET_KEY` | Yes | Server | Stripe Dashboard → Developers → API keys → Secret key. Use `sk_test_` for dev, `sk_live_` for production. |
| `STRIPE_WEBHOOK_SECRET` | Yes | Server | Stripe Dashboard → Developers → Webhooks → Signing secret (`whsec_...`). Create a webhook endpoint pointing to `[DOMAIN]/api/webhooks/stripe`. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes | Client | Stripe Dashboard → Developers → API keys → Publishable key (`pk_test_` or `pk_live_`). |
| `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID` | Yes | Client | Stripe Dashboard → Products → Select product → Pricing → Price ID (`price_...`). |

### Webhook Events to Subscribe

When creating the Stripe webhook endpoint, subscribe to these events:
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

---

## Sentry (Error Tracking)

| Variable | Required | Server/Client | Where to Get It |
|----------|----------|---------------|-----------------|
| `NEXT_PUBLIC_SENTRY_DSN` | Production: Yes, Dev: Optional | Client | Sentry Dashboard → Settings → Client Keys (DSN) |
| `SENTRY_DSN` | Optional | Server | Legacy server-side alias. Leave blank unless overriding the public DSN server-side. |
| `SENTRY_AUTH_TOKEN` | CI only | Server (CI) | Sentry Dashboard → Settings → Auth Tokens. Store as GitHub Actions secret. |
| `SENTRY_ORG` | CI only | Server (CI) | Sentry organization slug. Store as GitHub Actions secret. |
| `SENTRY_PROJECT` | CI only | Server (CI) | Sentry project slug. Store as GitHub Actions secret. |

---

## Application

| Variable | Required | Server/Client | Where to Get It |
|----------|----------|---------------|-----------------|
| `NEXT_PUBLIC_APP_URL` | Yes | Client | The public URL of the application. `http://localhost:3000` for local dev, `https://[DOMAIN]` for production. |
| `NODE_ENV` | Auto-set | Server | Set automatically by Next.js. `development` locally, `production` in Vercel. |

---

## CI/CD (GitHub Actions Secrets)

These are NOT set in `.env` files. Store them as GitHub repository secrets.

| Secret | Where to Get It | Used By |
|--------|-----------------|---------|
| `VERCEL_TOKEN` | Vercel → Settings → Tokens → Create | deploy-preview.yml, deploy-production.yml |
| `VERCEL_ORG_ID` | Vercel → Settings → General → Team ID | deploy-preview.yml, deploy-production.yml |
| `VERCEL_PROJECT_ID` | Vercel → Project → Settings → General → Project ID | deploy-preview.yml, deploy-production.yml |
| `SENTRY_AUTH_TOKEN` | Sentry → Settings → Auth Tokens | ci.yml, deploy-preview.yml, deploy-production.yml |
| `SENTRY_ORG` | Sentry organization slug | ci.yml, deploy-preview.yml, deploy-production.yml |
| `SENTRY_PROJECT` | Sentry project slug | ci.yml, deploy-preview.yml, deploy-production.yml |

---

## Env Validation

All environment variables are validated at application startup via `apps/web/src/lib/env.ts`:

- **Client variables** (`NEXT_PUBLIC_*`): exported as `env` object. Fall back to empty string if missing in dev.
- **Server variables**: exported as `serverEnv` object. Throw immediately if missing (via `requireEnv()`).

**Rule**: No code outside `lib/env.ts`, `next.config.ts`, `sentry.*.config.ts`, `instrumentation.ts`, and `api/health/route.ts` should access `process.env` directly.

---

## Per-Environment Summary

| Variable | Local Dev | CI | Preview | Production |
|----------|----------|-----|---------|------------|
| `DATABASE_URL` | Real Supabase (dev project) | Placeholder | Vercel env | Vercel env |
| `STRIPE_SECRET_KEY` | `sk_test_...` | Not needed | `sk_test_...` | `sk_live_...` |
| `NEXT_PUBLIC_SENTRY_DSN` | Optional | Optional | Set | Set |
| `SENTRY_AUTH_TOKEN` | Not needed | GitHub Secret | GitHub Secret | GitHub Secret |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Not needed | Auto (Vercel) | `https://[DOMAIN]` |
