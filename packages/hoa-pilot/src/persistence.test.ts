import assert from "node:assert/strict";
import test from "node:test";

import { Prisma, PrismaClient } from "@client/database";

import { loadSyntheticCorpus } from "./corpus.js";
import * as persistence from "./persistence.js";
import { runPipeline } from "./pipeline.js";

const TENANT_A = "hoa-tenant-a";
const TENANT_B = "hoa-tenant-b";

async function runAsTenant<T>(
  prisma: PrismaClient,
  tenantId: string,
  operation: (transaction: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async (transaction) => {
    await transaction.$executeRaw(
      Prisma.sql`SELECT set_config('app.tenant_id', ${tenantId}, true)`,
    );
    return operation(transaction);
  });
}

test("synthetic corpus persists tenant-isolated cases through an always-human append-only approval queue", async () => {
  const adminDatabaseUrl = process.env.HOA_TEST_ADMIN_DATABASE_URL;
  const appDatabaseUrl = process.env.DATABASE_URL;
  assert.ok(adminDatabaseUrl, "HOA_TEST_ADMIN_DATABASE_URL is required");
  assert.ok(appDatabaseUrl, "DATABASE_URL is required");

  const admin = new PrismaClient({
    datasources: { db: { url: adminDatabaseUrl } },
  });
  const app = new PrismaClient({
    datasources: { db: { url: appDatabaseUrl } },
  });

  try {
    await admin.hoaTenant.createMany({
      data: [
        {
          id: TENANT_A,
          slug: "synthetic-tenant-a",
          name: "Synthetic Tenant A",
        },
        {
          id: TENANT_B,
          slug: "synthetic-tenant-b",
          name: "Synthetic Tenant B",
        },
      ],
    });

    const corpus = await loadSyntheticCorpus();
    const pipeline = runPipeline(corpus);
    const persisted: Array<{ caseId: string; suggestionId: string }> = [];

    for (const ticket of pipeline.tickets) {
      persisted.push(
        await persistence.persistCaseSuggestion(app, {
          tenantId: TENANT_A,
          ...ticket,
        }),
      );
    }
    const persistedTenantB = await persistence.persistCaseSuggestion(app, {
      tenantId: TENANT_B,
      ...pipeline.tickets.at(-1)!,
    });

    assert.equal(persisted.length, corpus.length);
    assert.ok(persisted[0]);
    assert.ok(persisted[1]);

    const tenantACase = await persistence.getCaseForTenant(
      app,
      TENANT_A,
      persisted[0].caseId,
    );
    assert.equal(tenantACase.tenantId, TENANT_A);

    // @positive-control(hoa-tenant-case-rls)
    const crossTenantCase = await runAsTenant(app, TENANT_B, (transaction) =>
      transaction.hoaCase.findUnique({ where: { id: persisted[0]!.caseId } }),
    );
    assert.equal(crossTenantCase, null);
    await assert.rejects(
      () => persistence.getCaseForTenant(app, TENANT_B, persisted[0]!.caseId),
      (error: unknown) =>
        error instanceof persistence.HoaPersistenceError &&
        error.code === "not_found",
    );

    // @positive-control(hoa-tenant-suggestion-rls)
    const crossTenantSuggestion = await runAsTenant(
      app,
      TENANT_B,
      (transaction) =>
        transaction.hoaClassifierSuggestion.findUnique({
          where: { id: persisted[0]!.suggestionId },
        }),
    );
    assert.equal(crossTenantSuggestion, null);

    // @positive-control(hoa-case-suggestion-tenant-link)
    await assert.rejects(
      () =>
        runAsTenant(app, TENANT_A, (transaction) =>
          transaction.$executeRaw(
            Prisma.sql`
              INSERT INTO "hoa_classifier_suggestions"
                ("id", "tenantId", "caseId", "category", "urgency", "suggestedOwner", "reasonCodes")
              VALUES
                ('synthetic-cross-tenant-suggestion', ${TENANT_A}, ${persistedTenantB.caseId},
                 'maintenance', 'normal', 'property_manager', ARRAY['cross_tenant_probe'])
            `,
          ),
        ),
      /foreign key constraint/,
    );

    // @positive-control(hoa-suggestion-decision-tenant-link)
    await assert.rejects(
      () =>
        runAsTenant(app, TENANT_A, (transaction) =>
          transaction.$executeRaw(
            Prisma.sql`
              INSERT INTO "hoa_decision_events"
                ("id", "tenantId", "suggestionId", "decision", "decisionSource", "humanActorId")
              VALUES
                ('synthetic-cross-tenant-decision', ${TENANT_A}, ${persistedTenantB.suggestionId},
                 'APPROVED'::"HoaDecision", 'HUMAN'::"HoaDecisionSource", 'synthetic-human-manager-a')
            `,
          ),
        ),
      /foreign key constraint/,
    );

    const pendingBefore = await persistence.listPendingApprovals(app, TENANT_A);
    assert.equal(pendingBefore.length, corpus.length);
    assert.ok(
      pendingBefore.some(({ id }) => id === persisted[0]!.suggestionId),
    );

    // @positive-control(hoa-human-approval-required)
    await assert.rejects(
      () =>
        persistence.requireHumanApprovedSuggestion(
          app,
          TENANT_A,
          persisted[0]!.suggestionId,
        ),
      (error: unknown) =>
        error instanceof persistence.HoaPersistenceError &&
        error.code === "approval_required",
    );

    const approvedEvent = await persistence.recordHumanDecision(app, {
      tenantId: TENANT_A,
      suggestionId: persisted[0].suggestionId,
      decision: persistence.HoaDecision.APPROVED,
      humanActorId: "synthetic-human-manager-a",
      rationale: "Synthetic approval for the phase-2 positive control",
    });
    const rejectedEvent = await persistence.recordHumanDecision(app, {
      tenantId: TENANT_A,
      suggestionId: persisted[1].suggestionId,
      decision: persistence.HoaDecision.REJECTED,
      humanActorId: "synthetic-human-manager-a",
      rationale: "Synthetic rejection for the no-auto-application control",
    });

    const approval = await persistence.requireHumanApprovedSuggestion(
      app,
      TENANT_A,
      persisted[0].suggestionId,
    );
    assert.equal(approval.decisionEventId, approvedEvent.id);
    assert.equal(approval.humanActorId, "synthetic-human-manager-a");
    await assert.rejects(
      () =>
        persistence.requireHumanApprovedSuggestion(
          app,
          TENANT_A,
          persisted[1]!.suggestionId,
        ),
      (error: unknown) =>
        error instanceof persistence.HoaPersistenceError &&
        error.code === "approval_required",
    );

    const pendingAfter = await persistence.listPendingApprovals(app, TENANT_A);
    assert.equal(pendingAfter.length, corpus.length - 2);
    assert.equal(
      pendingAfter.some(({ id }) => id === persisted[0]!.suggestionId),
      false,
    );
    assert.equal(
      pendingAfter.some(({ id }) => id === persisted[1]!.suggestionId),
      false,
    );

    const history = await persistence.listDecisionHistory(
      app,
      TENANT_A,
      persisted[0].suggestionId,
    );
    assert.equal(history.length, 1);
    assert.equal(history[0]?.decision, persistence.HoaDecision.APPROVED);
    assert.equal(history[0]?.decisionSource, "HUMAN");

    // @positive-control(hoa-tenant-decision-rls)
    const crossTenantDecision = await runAsTenant(
      app,
      TENANT_B,
      (transaction) =>
        transaction.hoaDecisionEvent.findUnique({
          where: { id: approvedEvent.id },
        }),
    );
    assert.equal(crossTenantDecision, null);

    // @positive-control(hoa-human-decision-source)
    await assert.rejects(
      () =>
        runAsTenant(app, TENANT_A, (transaction) =>
          transaction.$executeRaw(
            Prisma.sql`
              INSERT INTO "hoa_decision_events"
                ("id", "tenantId", "suggestionId", "decision", "decisionSource", "humanActorId")
              VALUES
                ('synthetic-automation-event', ${TENANT_A}, ${persisted[0]!.suggestionId},
                 'APPROVED'::"HoaDecision", ${"AUTOMATION"}::"HoaDecisionSource", 'automation')
            `,
          ),
        ),
      /invalid input value for enum "HoaDecisionSource"/,
    );

    // The app role deliberately has UPDATE and DELETE grants, so these controls
    // prove the database trigger fires rather than merely observing a permission error.
    // @positive-control(hoa-decision-events-append-only)
    await assert.rejects(
      () =>
        runAsTenant(app, TENANT_A, (transaction) =>
          transaction.$executeRaw(
            Prisma.sql`
              UPDATE "hoa_decision_events"
              SET "rationale" = 'tampered'
              WHERE "id" = ${approvedEvent.id}
            `,
          ),
        ),
      /hoa_decision_events is append-only/,
    );
    await assert.rejects(
      () =>
        runAsTenant(app, TENANT_A, (transaction) =>
          transaction.$executeRaw(
            Prisma.sql`
              DELETE FROM "hoa_decision_events"
              WHERE "id" = ${approvedEvent.id}
            `,
          ),
        ),
      /hoa_decision_events is append-only/,
    );

    const unchangedHistory = await persistence.listDecisionHistory(
      app,
      TENANT_A,
      persisted[0].suggestionId,
    );
    assert.deepEqual(unchangedHistory, history);

    const firstFixture = corpus[0];
    assert.ok(firstFixture);
    const storedText = `${tenantACase.redactedSubject}\n${tenantACase.redactedBody}`;
    const knownRawValues = [
      firstFixture.resident?.name,
      firstFixture.resident?.email,
      firstFixture.resident?.phone,
      firstFixture.property?.streetAddress,
      firstFixture.property?.unit,
      firstFixture.accountReference,
    ].filter((value): value is string => Boolean(value));
    for (const rawValue of knownRawValues) {
      assert.equal(storedText.includes(rawValue), false);
    }
    assert.equal("subject" in tenantACase, false);
    assert.equal("body" in tenantACase, false);
    assert.equal("resident" in tenantACase, false);
    assert.equal("property" in tenantACase, false);

    const forbiddenActionExports = Object.keys(persistence).filter((name) =>
      /apply|dispatch|execute|fine|notice|send/iu.test(name),
    );
    assert.deepEqual(forbiddenActionExports, []);
    assert.notEqual(rejectedEvent.id, approvedEvent.id);

    console.log(
      `EVIDENCE tenant_isolation tenant_a_case=${persisted[0].caseId} tenant_b_direct_rows=0 service_result=BLOCKED`,
    );
    console.log(
      `EVIDENCE approval_flow synthetic=${corpus.length} pending_before=${pendingBefore.length} decisions=2 pending_after=${pendingAfter.length} approved_audit_rows=${history.length} auto_action_exports=${forbiddenActionExports.length}`,
    );
    console.log(
      "EVIDENCE append_only update=REJECTED delete=REJECTED history_unchanged=true decision_source_automation=REJECTED",
    );
    console.log(
      `EVIDENCE redacted_persistence raw_identifier_leaks=0 stored_case_fields=${Object.keys(tenantACase).sort().join(",")}`,
    );
  } finally {
    await Promise.all([admin.$disconnect(), app.$disconnect()]);
  }
});
