# Maintenance Guide

> Ongoing maintenance procedures for the [CLIENT_NAME] application.

---

## Dependency Updates

### Routine Updates (Monthly)

```bash
# Check for outdated packages
pnpm outdated

# Update non-breaking (patch + minor) versions
pnpm update

# Update a specific package
pnpm --filter web update next@latest

# After updates, always:
pnpm lint
pnpm build
# Test locally before committing
```

### Security Patches (Immediate)

```bash
# Check for known vulnerabilities
pnpm audit

# Fix automatically where possible
pnpm audit --fix

# For manual fixes, update the specific package
pnpm --filter web update [package]@latest
```

### Major Version Upgrades

Major upgrades (e.g., Next.js 16 → 17, Prisma 6 → 7) require:

1. Read the migration guide from the framework
2. Create a feature branch
3. Update the package and fix breaking changes
4. Run full test suite
5. Test all critical paths manually
6. Deploy to preview, verify, then merge to main

---

## Database Backups

### Supabase Automatic Backups

| Plan | Backup Frequency | Retention |
|------|-----------------|-----------|
| Free | None | — |
| Pro | Daily | 7 days |
| Team | Daily | 14 days |
| Enterprise | Point-in-time recovery | 14 days |

Access backups: Supabase Dashboard → Settings → Database → Backups

### Manual Backup

```bash
# Export database using pg_dump (requires direct connection string)
pg_dump "postgresql://postgres.[ref]:password@host:5432/postgres" \
  --no-owner --no-privileges --format=custom \
  -f backup_$(date +%Y%m%d).dump

# Restore from backup
pg_restore --no-owner --no-privileges -d "postgresql://..." backup.dump
```

### Before Risky Migrations

Always take a manual backup before running migrations that modify or delete data:

```bash
pg_dump "..." -f pre_migration_$(date +%Y%m%d_%H%M%S).dump
pnpm --filter @client/database exec prisma migrate deploy
```

---

## SSL Certificate Management

**Vercel handles SSL automatically.** No manual certificate management is required.

- Vercel provisions and renews Let's Encrypt certificates automatically
- Custom domains added in Vercel Dashboard receive SSL within minutes
- No action needed for renewal

For Supabase database connections, SSL is enforced by default on the pooler and direct connections.

---

## Monitoring and Alerting

### Health Check Monitoring

Set up uptime monitoring to ping `/api/health` every 1-5 minutes:

| Service | Free Tier | Recommended |
|---------|-----------|-------------|
| UptimeRobot | 50 monitors, 5-min interval | Yes |
| Better Uptime | 10 monitors, 3-min interval | Yes |
| Vercel Monitoring | Built-in, basic | Free with Vercel |

### Sentry Alerts

Recommended alert rules (Sentry → Alerts → Create Rule):

| Alert | Trigger | Channel |
|-------|---------|---------|
| New error spike | >5 new errors in 1 hour | Email / Slack |
| High error rate | >1% of requests fail | Email / Slack / PagerDuty |
| Unresolved critical | Any unresolved "fatal" error after 1 hour | Email |

### Stripe Alerts

In Stripe Dashboard → Developers → Webhooks:
- Monitor for failed webhook deliveries (Stripe retries automatically, but persistent failures indicate an issue)
- Set up email alerts for failed payments (Stripe → Settings → Email notifications)

---

## Incident Response Template

### When an Incident Occurs

1. **Detect**: Health check fails, Sentry alert fires, or user report received
2. **Assess**: Check Sentry for errors, Vercel for deployment status, Supabase for database health
3. **Communicate**: Notify stakeholders of the issue and estimated resolution time
4. **Resolve**:
   - If deployment issue: roll back via Vercel Dashboard (instant)
   - If code issue: fix, test, deploy via normal CI/CD
   - If database issue: check Supabase status page, contact support if needed
   - If Stripe issue: check [status.stripe.com](https://status.stripe.com)
5. **Post-mortem**: Document what happened, root cause, and prevention measures

### Key Status Pages

| Service | Status Page |
|---------|-------------|
| Vercel | [vercel-status.com](https://vercel-status.com) |
| Supabase | [status.supabase.com](https://status.supabase.com) |
| Stripe | [status.stripe.com](https://status.stripe.com) |
| Sentry | [status.sentry.io](https://status.sentry.io) |
| GitHub | [githubstatus.com](https://www.githubstatus.com) |

---

## Scheduled Maintenance Tasks

| Frequency | Task | How |
|-----------|------|-----|
| Weekly | Check Sentry for new unresolved errors | Sentry Dashboard → Issues |
| Monthly | Update dependencies (patch/minor) | `pnpm outdated && pnpm update` |
| Monthly | Review Stripe webhook delivery logs | Stripe → Developers → Webhooks |
| Monthly | Check Supabase database size | Supabase → Settings → Database → Usage |
| Quarterly | Run `pnpm audit` for security vulnerabilities | Fix immediately if critical |
| Quarterly | Review and rotate API keys if needed | Follow key rotation policy |
| As needed | Apply Prisma schema migrations | `prisma migrate deploy` |

---

## Cost Management

### Expected Monthly Costs (Estimated)

| Service | Tier | Estimated Cost |
|---------|------|---------------|
| Vercel | Pro | $20/mo (per team member) |
| Supabase | Pro | $25/mo |
| Stripe | Usage-based | 2.9% + $0.30 per transaction |
| Sentry | Team | $26/mo (50K events) |
| Domain | Annual | ~$10-15/year |

### Cost Optimization Tips

- Supabase: Monitor database connections and storage usage
- Vercel: Use `force-dynamic` only where truly needed (reduces serverless function invocations)
- Sentry: Tune `tracesSampleRate` down from 1.0 in production to reduce event volume
- Stripe: No optimization needed (usage-based, no base fee)
