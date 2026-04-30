# [CLIENT_NAME] — System Architecture

> **Project**: [PROJECT_DESCRIPTION]
> **Domain**: [DOMAIN]
> **Last updated**: YYYY-MM-DD

---

## Technology Stack

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| **Monorepo** | Turborepo + pnpm workspaces | pnpm 10.32.1 | `apps/web`, `packages/database`, `packages/shared` |
| **Frontend** | Next.js (App Router) | 16.x | React 19, Server Components, Server Actions |
| **Styling** | Tailwind CSS + shadcn/ui | Tailwind 4.x | Base UI primitives, dark mode via next-themes |
| **ORM** | Prisma | 6.x | Shared schema in `packages/database` |
| **Database** | Supabase PostgreSQL | — | Connection pooler (port 6543) + direct (port 5432) |
| **Auth** | Supabase Auth | — | Email/password + Google OAuth, SSR via `@supabase/ssr` |
| **Payments** | Stripe | API 2026-03-25.dahlia | Checkout Sessions, Customer Portal, webhook sync |
| **Error Tracking** | Sentry | @sentry/nextjs 10.x | Client + server + edge, source map upload in CI |
| **CI/CD** | GitHub Actions → Vercel | — | Lint/build on push, preview on PR, production on main merge |
| **Deployment** | Vercel | — | Serverless, security headers via vercel.json |
| **Language** | TypeScript | 5.8+ | Strict mode enabled |

---

## System Diagram

```
[Browser]
    |
    |  HTTPS
    v
[Vercel Edge Network]
    |
    |  Next.js Middleware (Supabase session refresh + route protection)
    v
[Next.js App Router — apps/web]
    |
    |--- /api/auth/sync        --> [Supabase Auth] + [PostgreSQL via Prisma]
    |--- /api/billing/checkout --> [Stripe Checkout Sessions]
    |--- /api/billing/portal   --> [Stripe Customer Portal]
    |--- /api/billing/subscription --> [PostgreSQL via Prisma]
    |--- /api/webhooks/stripe  --> [Stripe Webhook Events] --> [PostgreSQL via Prisma]
    |--- /api/health           --> Runtime health check
    |
    v
[Supabase PostgreSQL]          [Stripe]              [Sentry]
  - users                        - Customers            - Error events
  - subscriptions                - Subscriptions        - Session replays
  - audit_logs                   - Checkout Sessions    - Source maps
```

---

## Data Flow

### Authentication Flow

1. User visits `/login` and submits credentials (email/password) or clicks Google OAuth
2. Supabase Auth validates credentials and issues a session (JWT stored in httpOnly cookies)
3. OAuth callback at `/auth/callback` exchanges the `code` for a session
4. After successful auth, `/api/auth/sync` upserts the user record in Prisma (idempotent)
5. Next.js middleware (`proxy.ts`) refreshes the session on every request and protects `/dashboard/*` routes
6. Client-side `useUser()` hook subscribes to auth state changes for UI updates

### Billing Flow

1. User clicks "Upgrade to Pro" on `/billing`
2. Frontend POSTs to `/api/billing/checkout` with the Stripe Price ID
3. API creates a Stripe Checkout Session with `userId` in metadata, returns checkout URL
4. User completes payment on Stripe-hosted checkout page
5. Stripe fires `checkout.session.completed` webhook to `/api/webhooks/stripe`
6. Webhook handler verifies signature, retrieves full subscription, propagates `userId` to subscription metadata
7. Handler upserts subscription record in Prisma using `stripeSubscriptionId` as the stable key
8. Subsequent lifecycle events (`subscription.updated`, `subscription.deleted`, `invoice.payment_failed`) update the local subscription state
9. `/api/billing/subscription` reads local Prisma record (no Stripe API call per request)
10. "Manage subscription" button creates a Stripe Customer Portal session

### Error Tracking Flow

1. Client-side errors captured by Sentry SDK (replay + breadcrumbs)
2. Server-side errors captured via `error.tsx` and `global-error.tsx` error boundaries
3. Source maps uploaded to Sentry during CI build, then deleted from output
4. Sentry enabled only in production (`process.env.NODE_ENV === "production"`)

---

## Monorepo Structure

```
client-starter/
  apps/
    web/                    # Next.js 16 application
      src/
        app/                # App Router pages and API routes
        components/         # UI components (shadcn/ui + layout)
        hooks/              # Client-side hooks (useUser)
        lib/                # Shared utilities (env, auth, stripe, supabase)
      sentry.*.config.ts    # Sentry SDK initialization
      vercel.json           # Deployment config + security headers
  packages/
    database/               # Prisma schema, client, seed script
      prisma/
        schema.prisma       # Database models
        seed.ts             # Development seed data
      src/
        client.ts           # PrismaClient singleton
    shared/                 # Cross-package types and constants
      src/
        constants.ts        # APP_NAME, DEFAULT_LOCALE
        types.ts            # Shared TypeScript interfaces
  .github/workflows/
    ci.yml                  # Lint + type-check + build on push/PR
    deploy-preview.yml      # Vercel preview on PR to main
    deploy-production.yml   # Vercel production on merge to main
  turbo.json                # Turborepo task configuration
```

---

## Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| App Router (not Pages Router) | Server Components reduce client JS; layouts compose naturally |
| Supabase Auth (not NextAuth) | Managed service with RLS, Google OAuth built-in, SSR support via `@supabase/ssr` |
| Prisma as ORM (not Drizzle) | Type-safe queries, migration tooling, broad community support |
| Stripe Checkout (not Payment Intents) | Hosted checkout reduces PCI scope; Customer Portal for self-service management |
| Webhook-synced subscriptions | Local DB read for subscription status avoids per-request Stripe API calls and rate limits |
| vercel.json security headers | Declarative, version-controlled, applied at the CDN edge |
| Turborepo monorepo | Shared database package, shared types, single CI pipeline |

---

## Client-Specific Customization Points

| Area | File(s) | What to Change |
|------|---------|---------------|
| App name / branding | `packages/shared/src/constants.ts`, `apps/web/src/app/layout.tsx` | `APP_NAME`, metadata title |
| Theme / colors | `apps/web/src/app/globals.css` | CSS custom properties for shadcn/ui theme |
| Stripe Price IDs | `apps/web/src/lib/env.ts` | Add price IDs per product tier |
| Auth providers | Supabase Dashboard → Authentication → Providers | Enable/disable OAuth providers |
| Database models | `packages/database/prisma/schema.prisma` | Add client-specific models |
| Landing page | `apps/web/src/app/page.tsx` | Replace with client content |
| Free/Pro feature lists | `apps/web/src/app/(dashboard)/billing/page.tsx` | Update plan comparison |
