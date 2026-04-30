# Database Schema Documentation

> Auto-documented from `packages/database/prisma/schema.prisma`.
> Database: Supabase PostgreSQL.

---

## Models

### User (`users` table)

The base user model. Extended per client project.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | PK, cuid() | Internal user ID |
| `supabaseId` | String? | Unique | Supabase Auth user ID (linked after first login) |
| `email` | String | Unique | User's email address |
| `name` | String? | — | Display name (from OAuth profile or manual entry) |
| `avatarUrl` | String? | — | Profile avatar URL (from OAuth provider) |
| `emailVerified` | Boolean | Default: false | Whether email has been confirmed |
| `role` | Role enum | Default: MEMBER | User's role (ADMIN, MEMBER, VIEWER) |
| `createdAt` | DateTime | Default: now() | Account creation timestamp |
| `updatedAt` | DateTime | @updatedAt | Last modification timestamp |

**Relations**: Has one `Subscription`, has many `AuditLog` entries.

---

### Subscription (`subscriptions` table)

Stores Stripe subscription state, synced via webhook events.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | PK, cuid() | Internal subscription ID |
| `userId` | String | Unique, FK → User.id | Owning user |
| `stripeCustomerId` | String | Unique | Stripe Customer ID (`cus_...`) |
| `stripeSubscriptionId` | String | Unique | Stripe Subscription ID (`sub_...`) |
| `stripePriceId` | String | — | Active Stripe Price ID (`price_...`) |
| `status` | SubscriptionStatus | — | Current subscription status |
| `currentPeriodStart` | DateTime | — | Start of current billing period |
| `currentPeriodEnd` | DateTime | — | End of current billing period |
| `cancelAtPeriodEnd` | Boolean | Default: false | Whether subscription cancels at period end |
| `createdAt` | DateTime | Default: now() | Record creation timestamp |
| `updatedAt` | DateTime | @updatedAt | Last sync timestamp |

**Indexes**: `stripeCustomerId`, `stripeSubscriptionId`
**Cascade**: Deleted when owning User is deleted (`onDelete: Cascade`)

---

### AuditLog (`audit_logs` table)

Records significant actions for compliance and debugging.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | PK, cuid() | Log entry ID |
| `userId` | String? | FK → User.id | Acting user (null for system actions) |
| `action` | String | — | Action identifier (e.g., `user.created`, `subscription.created`) |
| `entity` | String | — | Entity type affected (e.g., `User`, `Subscription`) |
| `entityId` | String? | — | ID of the affected entity |
| `metadata` | Json? | — | Additional context (e.g., `{email, role}`) |
| `ipAddress` | String? | — | Client IP address |
| `userAgent` | String? | — | Client user agent string |
| `createdAt` | DateTime | Default: now() | When the action occurred |

**Indexes**: `userId`, `(entity, entityId)`, `createdAt`
**Cascade**: userId set to null if owning User is deleted (`onDelete: SetNull`)

---

## Enums

### Role

| Value | Description |
|-------|-------------|
| `ADMIN` | Full access — can manage users and billing |
| `MEMBER` | Standard access — can use all features |
| `VIEWER` | Read-only access |

### SubscriptionStatus

| Value | Stripe Status | Description |
|-------|--------------|-------------|
| `ACTIVE` | `active` | Subscription is paid and active |
| `CANCELED` | `canceled` | Subscription has been canceled |
| `PAST_DUE` | `past_due` | Payment failed, retrying |
| `TRIALING` | `trialing` | In free trial period |
| `INCOMPLETE` | `incomplete`, `incomplete_expired`, `unpaid`, `paused` | Setup not complete or payment issues |

---

## Common Queries

### Find user by Supabase ID

```typescript
const user = await prisma.user.findUnique({
  where: { supabaseId: "supabase-user-uuid" },
  include: { subscription: true },
});
```

### Get user's subscription status

```typescript
const user = await prisma.user.findUnique({
  where: { supabaseId: userId },
  select: {
    subscription: {
      select: { status: true, currentPeriodEnd: true, cancelAtPeriodEnd: true },
    },
  },
});
const isActive = user?.subscription?.status === "ACTIVE";
```

### Upsert user from Supabase Auth (auth sync)

```typescript
await prisma.user.upsert({
  where: { supabaseId: user.id },
  create: { supabaseId: user.id, email, name, avatarUrl, emailVerified },
  update: { email, name, avatarUrl, emailVerified },
});
```

### Create audit log entry

```typescript
await prisma.auditLog.create({
  data: {
    userId: user.id,
    action: "subscription.upgraded",
    entity: "Subscription",
    entityId: subscription.id,
    metadata: { fromPlan: "free", toPlan: "pro" },
    ipAddress: request.headers.get("x-forwarded-for"),
  },
});
```

---

## Migration Procedures

### Creating a New Migration

```bash
# 1. Edit schema.prisma
# 2. Generate migration SQL
pnpm --filter @client/database exec prisma migrate dev --name descriptive_name

# 3. Review the generated SQL in prisma/migrations/
# 4. Commit the migration file
```

### Deploying Migrations

```bash
# Production / staging (applies pending migrations)
pnpm --filter @client/database exec prisma migrate deploy
```

### Resetting the Database (Development Only)

```bash
# Drops all data, re-applies all migrations, re-runs seed
pnpm --filter @client/database exec prisma migrate reset
```

### Migration Best Practices

- Migrations must be backward-compatible (additive first, then code, then cleanup)
- Never drop columns without a prior release that stops reading them
- Always test migrations locally before deploying to staging
- New required columns must have a default value or be nullable initially
