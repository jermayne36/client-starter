# Admin Guide

> How to manage the [CLIENT_NAME] application in production.

---

## User Management

### Supabase Dashboard

Access: [supabase.com/dashboard](https://supabase.com/dashboard) → Select project → Authentication

| Task | How |
|------|-----|
| View all users | Authentication → Users |
| Disable a user | Users → Select user → Ban user |
| Delete a user | Users → Select user → Delete user (cascades: subscription deleted, audit logs preserved with null userId) |
| Reset a password | Users → Select user → Send password reset |
| View login activity | Authentication → Users → Select user → Activity tab |

### Prisma Studio (Database Direct Access)

For direct database inspection:

```bash
pnpm --filter @client/database exec prisma studio
```

Opens a web UI at `http://localhost:5555` showing all database tables.

### Role Management

User roles are stored in the `users` table. Update via Prisma Studio or a database query:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'user@example.com';
```

| Role | Permissions |
|------|------------|
| `ADMIN` | Full access, can manage billing and users |
| `MEMBER` | Standard feature access |
| `VIEWER` | Read-only access |

---

## Subscription Management

### Stripe Dashboard

Access: [dashboard.stripe.com](https://dashboard.stripe.com)

| Task | How |
|------|-----|
| View all subscriptions | Subscriptions → All |
| Cancel a subscription | Subscriptions → Select → Cancel subscription |
| Refund a payment | Payments → Select → Refund |
| Create a coupon | Products → Coupons → New |
| View webhook deliveries | Developers → Webhooks → Select endpoint → Attempts |
| Retry a failed webhook | Webhook attempts → Select → Retry |

### Subscription Status Sync

The app reads subscription status from the local database (not Stripe directly). If status is out of sync:

1. Check Stripe Dashboard for the current subscription state
2. Check webhook delivery logs for failed events
3. If a webhook was missed, Stripe allows manual retry from the dashboard
4. As a last resort, update the local database via Prisma Studio

### Common Billing Scenarios

| Scenario | Action |
|----------|--------|
| User wants a refund | Stripe Dashboard → Payments → Refund |
| User's payment failed | Wait for Stripe's automatic retry (3 attempts). Webhook updates status to `PAST_DUE`. |
| User wants to change plans | Direct them to the Manage Subscription button (Stripe Customer Portal) |
| Need to offer a discount | Create a Stripe Coupon, share the promo code or apply manually |

---

## Error Monitoring

### Sentry Dashboard

Access: [sentry.io](https://sentry.io) → Select project

| Task | How |
|------|-----|
| View recent errors | Issues → Sort by "Last Seen" |
| View error details | Click issue → Event details (stack trace, breadcrumbs, user context) |
| Resolve an issue | Mark as "Resolved" after deploying a fix |
| View session replays | Performance → Session Replay |
| Set up alerts | Alerts → Create Alert Rule (e.g., notify Slack on new errors) |

### Error Severity Guidelines

| Sentry Level | Action |
|-------------|--------|
| Fatal / Error with >10 users | Investigate immediately |
| Error with 1-10 users | Investigate within 24 hours |
| Warning | Review during next sprint |
| Info | Informational only |

---

## Analytics Setup Notes

Analytics is not pre-configured in the starter. Recommended setup:

1. **Google Analytics 4**: Add the GA4 measurement ID to the app
2. **Vercel Analytics**: Enable in Vercel Dashboard → Project → Analytics (one-click)
3. **Vercel Speed Insights**: Enable for Core Web Vitals monitoring

---

## Common Admin Tasks

### Check Application Health

```bash
curl https://[DOMAIN]/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-04-12T10:00:00.000Z",
  "version": "0.1.0",
  "environment": "production",
  "checks": { "server": true, "env": true }
}
```

### View Deployment Status

- Vercel Dashboard → Deployments — shows all deployments with status
- GitHub → Actions — shows CI/CD pipeline runs

### Access Database Directly

For emergency database access:

1. Use Supabase Dashboard → SQL Editor for ad-hoc queries
2. Or connect via `psql` using the direct connection string (not pooler)

### View Audit Logs

Query the `audit_logs` table for user activity:

```sql
SELECT al.*, u.email
FROM audit_logs al
LEFT JOIN users u ON al."userId" = u.id
ORDER BY al."createdAt" DESC
LIMIT 50;
```
