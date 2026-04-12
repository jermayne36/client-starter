# Deployment Runbook

> Step-by-step guide for deploying the [CLIENT_NAME] application from zero to production.

---

## Prerequisites

### Accounts Required

| Service | Purpose | URL |
|---------|---------|-----|
| **GitHub** | Source code, CI/CD | github.com |
| **Vercel** | Frontend hosting + serverless | vercel.com |
| **Supabase** | PostgreSQL database + Auth | supabase.com |
| **Stripe** | Payments + subscriptions | stripe.com |
| **Sentry** | Error tracking + monitoring | sentry.io |

### Local Tools

| Tool | Version | Install |
|------|---------|---------|
| Node.js | See `.nvmrc` | `nvm install` |
| pnpm | 10.32.1 | `corepack enable && corepack prepare pnpm@10.32.1 --activate` |
| Git | 2.x+ | System package manager |
| Vercel CLI | Latest | `npm install -g vercel@latest` |
| Stripe CLI | Latest | `brew install stripe/stripe-cli/stripe` (macOS) |

---

## 1. Initial Setup

### 1.1 Clone and Install

```bash
git clone https://github.com/[ORG]/[REPO].git
cd [REPO]
pnpm install
```

### 1.2 Create Environment File

```bash
cp .env.example .env
```

Fill in all values. See `docs/handoff/environment-variables.md` for where to find each value.

### 1.3 Set Up Supabase

1. Create a new Supabase project at [supabase.com/dashboard](https://supabase.com/dashboard)
2. Copy the database connection strings (pooler + direct) into `.env`
3. Copy the project URL, anon key, and service role key into `.env`
4. Enable Google OAuth provider (Authentication → Providers → Google) if needed
5. Set the Site URL (Authentication → URL Configuration) to `http://localhost:3000` for local dev

### 1.4 Run Database Migrations

```bash
pnpm --filter @client/database exec prisma migrate deploy
```

### 1.5 Generate Prisma Client

```bash
pnpm --filter @client/database exec prisma generate
```

### 1.6 Seed Development Data (Optional)

```bash
pnpm --filter @client/database exec prisma db seed
```

Creates demo users (admin@example.com, member@example.com) and sample subscription data.

### 1.7 Set Up Stripe

1. Create a product and price in Stripe Dashboard → Products
2. Copy the Price ID (`price_...`) into `.env` as `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID`
3. Create a webhook endpoint: Developers → Webhooks → Add endpoint
   - URL: `https://[DOMAIN]/api/webhooks/stripe` (use Stripe CLI for local dev)
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
4. Copy the webhook signing secret (`whsec_...`) into `.env`

### 1.8 Set Up Sentry (Optional for Local Dev)

1. Create a Sentry project (Next.js platform)
2. Copy the DSN into `.env` as `NEXT_PUBLIC_SENTRY_DSN`
3. Create an auth token (Settings → Auth Tokens) for CI source map uploads

---

## 2. Local Development

```bash
# Start the dev server
pnpm dev

# In a separate terminal, forward Stripe webhooks locally
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

The app runs at `http://localhost:3000`.

### Useful Commands

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build |
| `pnpm lint` | Run ESLint |
| `pnpm type-check` | Run TypeScript type checker |
| `pnpm --filter @client/database exec prisma studio` | Open Prisma Studio (DB browser) |
| `pnpm --filter @client/database exec prisma migrate dev` | Create new migration |
| `pnpm --filter @client/database exec prisma db seed` | Seed database |

---

## 3. Staging Deployment (Vercel Preview)

Preview deployments are created automatically when you open a pull request to `main`.

### Manual Preview Deploy

```bash
cd apps/web
vercel --token=$VERCEL_TOKEN
```

---

## 4. Production Deployment

Production deploys automatically when code is merged to `main`.

### CI/CD Pipeline

1. **CI** (`ci.yml`): Runs lint, type-check, and build on every push to `main`/`develop` and every PR to `main`
2. **Deploy Preview** (`deploy-preview.yml`): Deploys Vercel preview on PR to `main`, posts preview URL as PR comment
3. **Deploy Production** (`deploy-production.yml`): Deploys Vercel production on merge to `main`, runs post-deploy health check

### GitHub Actions Secrets Required

Set these in GitHub → Repository → Settings → Secrets and variables → Actions:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `SENTRY_AUTH_TOKEN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`

### Vercel Environment Variables

Set these in Vercel → Project → Settings → Environment Variables for Production:

- All variables from `.env.example` (with production values)
- Ensure `STRIPE_SECRET_KEY` uses `sk_live_` prefix
- Ensure `NEXT_PUBLIC_APP_URL` is the production domain

---

## 5. Post-Deploy Verification

### Automated Health Check

The production deploy workflow automatically runs:

```bash
curl -f --retry 10 --retry-delay 5 [DEPLOY_URL]/api/health
```

### Manual Verification Checklist

- [ ] Health check returns `{"status":"ok"}` at `/api/health`
- [ ] Landing page loads correctly
- [ ] Login page renders (email + Google OAuth)
- [ ] Sign up creates a new user
- [ ] Dashboard is accessible after login
- [ ] Billing page shows current plan
- [ ] "Upgrade to Pro" redirects to Stripe Checkout
- [ ] Stripe webhook fires and syncs subscription
- [ ] Sentry test: trigger an error and verify it appears in Sentry
- [ ] Error boundaries display graceful error messages

---

## 6. Rollback Procedure

### Vercel Instant Rollback

1. Go to Vercel Dashboard → Deployments
2. Find the last known-good deployment
3. Click the three-dot menu → Promote to Production

### Git Revert

```bash
git revert [commit-sha]
git push origin main
# CI/CD will auto-deploy the revert
```

### Database Rollback

If a Prisma migration needs to be rolled back:

```bash
# Mark migration as rolled back (does NOT undo schema changes)
pnpm --filter @client/database exec prisma migrate resolve --rolled-back [migration_name]

# Manually reverse schema changes in the database, then create a new migration
pnpm --filter @client/database exec prisma migrate dev --name revert_[description]
```

**Important**: Supabase Pro plans include daily automatic backups. For critical rollbacks, restore from a Supabase backup via the dashboard.

---

## 7. DNS Configuration

| Record | Type | Value | Notes |
|--------|------|-------|-------|
| `[DOMAIN]` | CNAME | `cname.vercel-dns.com` | Root domain |
| `www.[DOMAIN]` | CNAME | `cname.vercel-dns.com` | WWW redirect |

Add the domain in Vercel → Project → Settings → Domains.
