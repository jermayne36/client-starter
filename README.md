# Client Starter

Turborepo monorepo template for EdukasAI consulting client web applications.

## Stack

- **Framework**: Next.js 16 (App Router, Server Components)
- **Styling**: Tailwind CSS 4 + shadcn/ui (add components via `npx shadcn@latest add`)
- **ORM**: Prisma with Supabase PostgreSQL
- **Language**: TypeScript (strict mode)
- **Package Manager**: pnpm
- **Monorepo**: Turborepo

## Prerequisites

- Node.js 22+ (see `.nvmrc`)
- pnpm 10+ (`corepack enable && corepack prepare pnpm@latest --activate`)
- PostgreSQL database (Supabase recommended)

## Setup

```bash
# Clone the repo
git clone https://github.com/jermayne36/client-starter.git my-project
cd my-project

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env

# Edit .env with your database credentials, Stripe keys, etc.

# Run database migrations (after configuring DATABASE_URL)
pnpm --filter @client/database db:push

# Start development server
pnpm dev
```

## Project Structure

```
client-starter/
  apps/
    web/                    # Next.js 16 app (App Router)
      src/
        app/                # Pages and layouts
        components/ui/      # shadcn/ui components
        lib/                # Utilities, env validation
  packages/
    database/               # Prisma schema + client
    hoa-pilot/              # Redacted intake, suggestions, approval persistence
    shared/                 # Shared types, constants
  .github/workflows/        # CI pipeline
  docs/handoff/             # Client handoff documentation
```

## Scripts

| Command                                     | Description                                                         |
| ------------------------------------------- | ------------------------------------------------------------------- |
| `pnpm dev`                                  | Start all apps in development mode                                  |
| `pnpm build`                                | Production build all packages                                       |
| `pnpm lint`                                 | Run ESLint across all packages                                      |
| `pnpm test`                                 | Run package tests through Turborepo                                 |
| `pnpm type-check`                           | TypeScript type checking                                            |
| `pnpm format`                               | Format code with Prettier                                           |
| `pnpm hoa:phase1`                           | Run the synthetic HOA intake → redaction → classifier-stub pipeline |
| `pnpm hoa:phase2:test`                      | Verify tenant RLS and the always-human approval queue in PostgreSQL |
| `pnpm --filter @client/database db:studio`  | Open Prisma Studio                                                  |
| `pnpm --filter @client/database db:migrate` | Run Prisma migrations                                               |
| `pnpm --filter @client/database db:push`    | Push schema to database                                             |

## HOA Pilot Skeleton — Phase 1

The client-independent HOA pilot pipeline runs locally against checked-in synthetic
tickets. It normalizes intake, redacts HOA identifiers with a fail-closed residual
scan, and produces deterministic classifier suggestions. It does not call an LLM,
send email, use client-platform APIs, or apply a suggested decision.

The phase-1 regex rules cover only the checked-in synthetic formats. The residual
scan reuses that bounded vocabulary as a consistency check; it is not independent
DLP or named-entity detection. Classifier input must carry runtime provenance from
the redaction stage, so a freely constructed redacted-shaped object is rejected.

```bash
pnpm hoa:phase1
```

The corpus lives at `packages/hoa-pilot/data/synthetic-hoa-tickets.json`.

## HOA Pilot Skeleton — Phase 2

Phase 2 persists only the normalized/redacted case fields and classifier suggestions.
PostgreSQL row-level security scopes cases, suggestions, and decision events to the
active tenant. Suggestions enter a pending queue until a human decision is appended;
decision events cannot be updated, deleted, or truncated. There is no send, apply,
fine, denial, vendor-dispatch, or other external action path.

The integration test uses a disposable PostgreSQL 16 Docker container and proves
cross-tenant reads fail, approval is required, non-human decision sources fail, and
decision-event mutation fails:

```bash
pnpm hoa:phase2:test
```

The dashboard, redaction-review surface, and expanded evaluation harness remain
Phase 3 scope.

## Adding shadcn/ui Components

```bash
cd apps/web
npx shadcn@latest init    # First time setup
npx shadcn@latest add button card dialog  # Add components
```

## Deployment

| Service            | Target                                               |
| ------------------ | ---------------------------------------------------- |
| **Frontend**       | Vercel (connect GitHub repo, set root to `apps/web`) |
| **Database**       | Supabase PostgreSQL                                  |
| **API** (if added) | Railway or Vercel Functions                          |

Set environment variables in your deployment platform matching `.env.example`.

## Extending the Starter

- **Auth**: Add Supabase Auth or NextAuth.js
- **Payments**: Wire Stripe via `@client/shared` types
- **API**: Add `apps/api` with Hono for standalone backend
- **Email**: Add SendGrid transactional email
- **Monitoring**: Add Sentry with `@sentry/nextjs`
