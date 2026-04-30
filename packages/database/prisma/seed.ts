/**
 * Prisma seed script — creates demo data for local development.
 *
 * Idempotent: safe to run multiple times. Uses upsert keyed on stable
 * fields (email, stripeSubscriptionId) so re-runs produce the same state.
 *
 * Run: pnpm --filter @client/database db:seed
 */
import { PrismaClient, SubscriptionStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database…");

  // -- Users -----------------------------------------------------------

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    create: {
      email: "admin@example.com",
      name: "Admin User",
      emailVerified: true,
      role: "ADMIN",
    },
    update: {
      name: "Admin User",
      role: "ADMIN",
    },
  });

  const memberUser = await prisma.user.upsert({
    where: { email: "member@example.com" },
    create: {
      email: "member@example.com",
      name: "Member User",
      emailVerified: true,
      role: "MEMBER",
    },
    update: {
      name: "Member User",
      role: "MEMBER",
    },
  });

  console.log(`  ✓ Users: ${adminUser.email}, ${memberUser.email}`);

  // -- Subscription (admin has Pro) ------------------------------------

  const now = new Date();
  const periodStart = new Date(now);
  periodStart.setDate(1); // First of current month
  const periodEnd = new Date(periodStart);
  periodEnd.setMonth(periodEnd.getMonth() + 1); // First of next month

  const subscription = await prisma.subscription.upsert({
    where: { stripeSubscriptionId: "sub_demo_admin_001" },
    create: {
      userId: adminUser.id,
      stripeCustomerId: "cus_demo_admin_001",
      stripeSubscriptionId: "sub_demo_admin_001",
      stripePriceId: "price_pro_monthly",
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
    },
    update: {
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
    },
  });

  console.log(
    `  ✓ Subscription: ${subscription.stripeSubscriptionId} (${subscription.status})`,
  );

  // -- Audit logs -------------------------------------------------------

  const auditEntries = [
    {
      userId: adminUser.id,
      action: "user.created",
      entity: "User",
      entityId: adminUser.id,
      metadata: { email: adminUser.email, role: "ADMIN" } as Record<string, string>,
    },
    {
      userId: adminUser.id,
      action: "subscription.created",
      entity: "Subscription",
      entityId: subscription.id,
      metadata: { plan: "pro", priceId: "price_pro_monthly" } as Record<string, string>,
    },
    {
      userId: memberUser.id,
      action: "user.created",
      entity: "User",
      entityId: memberUser.id,
      metadata: { email: memberUser.email, role: "MEMBER" } as Record<string, string>,
    },
    {
      userId: adminUser.id,
      action: "user.login",
      entity: "User",
      entityId: adminUser.id,
      metadata: { provider: "email" } as Record<string, string>,
      ipAddress: "127.0.0.1",
      userAgent: "Mozilla/5.0 (seed script)",
    },
  ];

  const existingAuditCount = await prisma.auditLog.count();
  if (existingAuditCount === 0) {
    for (const entry of auditEntries) {
      await prisma.auditLog.create({ data: entry });
    }
    console.log(`  ✓ Audit logs: ${auditEntries.length} entries`);
  } else {
    console.log(`  ↩ Audit logs: skipped (${existingAuditCount} already exist)`);
  }
  console.log("✅ Seed complete.");
}

main()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
