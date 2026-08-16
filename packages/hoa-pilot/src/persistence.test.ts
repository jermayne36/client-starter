import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import test from "node:test";

import { Prisma, PrismaClient } from "@client/database";

import { loadSyntheticCorpus } from "./corpus.js";
import * as persistence from "./persistence.js";
import { runPipeline } from "./pipeline.js";
import type { ClassifierSuggestion } from "./types.js";

const TENANT_A = "hoa-tenant-a";
const TENANT_B = "hoa-tenant-b";
const TENANT_A_TOKEN = "synthetic-membership-token-a-7b1396";
const TENANT_B_TOKEN = "synthetic-membership-token-b-17a92c";
const TENANT_A_ACTOR = "hoa-human-a-9f2d";
const TENANT_B_ACTOR = "hoa-human-b-8c1e";
const RAW_PROBE = "raw.person+hoa@example.invalid";

function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

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

test("verified memberships persist tenant-isolated cases through a human-only append-only approval queue", async () => {
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
    await admin.$executeRaw(
      Prisma.sql`
        INSERT INTO "hoa_memberships"
          ("id", "tenantId", "accessTokenHash", "humanActorId")
        VALUES
          ('membership-a', ${TENANT_A}, ${hashToken(TENANT_A_TOKEN)}, ${TENANT_A_ACTOR}),
          ('membership-b', ${TENANT_B}, ${hashToken(TENANT_B_TOKEN)}, ${TENANT_B_ACTOR})
      `,
    );

    const memberA = await persistence.authenticateHoaMembership(
      app,
      TENANT_A_TOKEN,
    );
    const memberB = await persistence.authenticateHoaMembership(
      app,
      TENANT_B_TOKEN,
    );

    await assert.rejects(
      () => app.hoaMembership.findMany(),
      /permission denied for table hoa_memberships/,
    );

    // @positive-control(hoa-membership-authentication)
    await assert.rejects(
      () => persistence.authenticateHoaMembership(app, "forged-token"),
      (error: unknown) =>
        error instanceof persistence.HoaPersistenceError &&
        error.code === "authentication_required",
    );

    // @positive-control(hoa-membership-capability)
    await assert.rejects(
      () =>
        persistence.listPendingApprovals({
          tenantId: TENANT_A,
          humanActorId: "automation-bot",
        } as unknown as persistence.HoaMembershipCapability),
      (error: unknown) =>
        error instanceof persistence.HoaPersistenceError &&
        error.code === "authentication_required",
    );

    const corpus = await loadSyntheticCorpus();
    const pipeline = runPipeline(corpus);
    const persisted: Array<{ caseId: string; suggestionId: string }> = [];

    for (const ticket of pipeline.tickets) {
      persisted.push(await persistence.persistCaseSuggestion(memberA, ticket));
    }
    const persistedTenantB = await persistence.persistCaseSuggestion(
      memberB,
      pipeline.tickets.at(-1)!,
    );

    assert.equal(persisted.length, corpus.length);
    assert.ok(persisted[0]);
    assert.ok(persisted[1]);

    const tenantACase = await persistence.getCaseForTenant(
      memberA,
      persisted[0].caseId,
    );
    assert.equal(tenantACase.tenantId, TENANT_A);

    // @positive-control(hoa-tenant-case-rls)
    const crossTenantCase = await runAsTenant(app, TENANT_B, (transaction) =>
      transaction.hoaCase.findUnique({ where: { id: persisted[0]!.caseId } }),
    );
    assert.equal(crossTenantCase, null);

    // Authenticated Tenant B supplies Tenant A's literal case ID and is denied.
    await assert.rejects(
      () => persistence.getCaseForTenant(memberB, persisted[0]!.caseId),
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
        admin.$executeRaw(
          Prisma.sql`
            INSERT INTO "hoa_classifier_suggestions"
              ("id", "tenantId", "caseId", "category", "urgency", "suggestedOwner", "reasonCodes")
            VALUES
              ('synthetic-cross-tenant-suggestion', ${TENANT_A}, ${persistedTenantB.caseId},
               'maintenance', 'normal', 'property_manager', ARRAY['maintenance_keyword'])
          `,
        ),
      /foreign key constraint/,
    );

    // @positive-control(hoa-suggestion-decision-tenant-link)
    await assert.rejects(
      () =>
        admin.$executeRaw(
          Prisma.sql`
            INSERT INTO "hoa_decision_events"
              ("id", "tenantId", "suggestionId", "decision", "decisionSource", "humanActorId")
            VALUES
              ('synthetic-cross-tenant-decision', ${TENANT_A}, ${persistedTenantB.suggestionId},
               'APPROVED'::"HoaDecision", 'HUMAN'::"HoaDecisionSource", ${TENANT_A_ACTOR})
          `,
        ),
      /foreign key constraint/,
    );

    const pendingBefore = await persistence.listPendingApprovals(memberA);
    assert.equal(pendingBefore.length, corpus.length);

    await assert.rejects(
      () =>
        persistence.recordHumanDecision(
          {
            tenantId: TENANT_A,
            humanActorId: "automation-bot",
          } as unknown as persistence.HoaMembershipCapability,
          {
            suggestionId: persisted[0]!.suggestionId,
            decision: persistence.HoaDecision.APPROVED,
            rationaleCode: "policy_verified",
          },
        ),
      (error: unknown) =>
        error instanceof persistence.HoaPersistenceError &&
        error.code === "authentication_required",
    );

    // @positive-control(hoa-human-approval-required)
    await assert.rejects(
      () =>
        persistence.requireHumanApprovedSuggestion(
          memberA,
          persisted[0]!.suggestionId,
        ),
      (error: unknown) =>
        error instanceof persistence.HoaPersistenceError &&
        error.code === "approval_required",
    );

    // @positive-control(hoa-persistence-suggestion-provenance)
    const forgedSuggestionFields: Array<keyof ClassifierSuggestion> = [
      "category",
      "urgency",
      "suggestedOwner",
      "reasonCodes",
    ];
    for (const field of forgedSuggestionFields) {
      const valid = pipeline.tickets[0]!.suggestion;
      const forged = {
        ...valid,
        [field]: field === "reasonCodes" ? [RAW_PROBE] : RAW_PROBE,
      } as unknown as ClassifierSuggestion;
      await assert.rejects(
        () =>
          persistence.persistCaseSuggestion(memberA, {
            redacted: pipeline.tickets[0]!.redacted,
            suggestion: forged,
          }),
        /did not come from classifyTicket/,
      );
    }

    // @positive-control(hoa-decision-rationale-code)
    await assert.rejects(
      () =>
        persistence.recordHumanDecision(memberA, {
          suggestionId: persisted[0]!.suggestionId,
          decision: persistence.HoaDecision.APPROVED,
          rationaleCode: RAW_PROBE as persistence.HumanDecisionRationaleCode,
        }),
      (error: unknown) =>
        error instanceof persistence.HoaPersistenceError &&
        error.code === "invalid_input",
    );

    // @positive-control(hoa-decision-direct-insert-denied)
    await assert.rejects(
      () =>
        runAsTenant(app, TENANT_A, (transaction) =>
          transaction.$executeRaw(
            Prisma.sql`
              INSERT INTO "hoa_decision_events"
                ("id", "tenantId", "suggestionId", "decision", "decisionSource", "humanActorId")
              VALUES
                ('synthetic-direct-event', ${TENANT_A}, ${persisted[0]!.suggestionId},
                 'APPROVED'::"HoaDecision", 'HUMAN'::"HoaDecisionSource", 'automation-bot')
            `,
          ),
        ),
      /permission denied for table hoa_decision_events/,
    );

    await assert.rejects(
      () =>
        app.$queryRaw(
          Prisma.sql`
            SELECT * FROM "record_hoa_human_decision"(
              'synthetic-forged-function-event',
              ${hashToken("forged-token")},
              ${persisted[0]!.suggestionId},
              'APPROVED'::"HoaDecision",
              'policy_verified'
            )
          `,
        ),
      /verified human membership is required/,
    );

    const approvedEvent = await persistence.recordHumanDecision(memberA, {
      suggestionId: persisted[0].suggestionId,
      decision: persistence.HoaDecision.APPROVED,
      rationaleCode: "policy_verified",
    });
    const rejectedEvent = await persistence.recordHumanDecision(memberA, {
      suggestionId: persisted[1].suggestionId,
      decision: persistence.HoaDecision.REJECTED,
      rationaleCode: "insufficient_information",
    });

    const approval = await persistence.requireHumanApprovedSuggestion(
      memberA,
      persisted[0].suggestionId,
    );
    const approvalReceipt = await persistence.resolveHumanApprovalCapability(
      approval,
      async (_transaction, receipt) => receipt,
    );
    assert.equal(approvalReceipt.decisionEventId, approvedEvent.id);
    assert.equal(approvalReceipt.humanActorId, TENANT_A_ACTOR);

    // @positive-control(hoa-approval-capability)
    await assert.rejects(
      () =>
        persistence.resolveHumanApprovalCapability(
          {
            tenantId: TENANT_A,
            suggestionId: persisted[0]!.suggestionId,
            decisionEventId: approvedEvent.id,
            humanActorId: "automation-bot",
          },
          async (_transaction, receipt) => receipt,
        ),
      (error: unknown) =>
        error instanceof persistence.HoaPersistenceError &&
        error.code === "approval_required",
    );

    await assert.rejects(
      () =>
        persistence.requireHumanApprovedSuggestion(
          memberA,
          persisted[1]!.suggestionId,
        ),
      (error: unknown) =>
        error instanceof persistence.HoaPersistenceError &&
        error.code === "approval_required",
    );

    const pendingAfter = await persistence.listPendingApprovals(memberA);
    assert.equal(pendingAfter.length, corpus.length - 2);
    const history = await persistence.listDecisionHistory(
      memberA,
      persisted[0].suggestionId,
    );
    assert.equal(history.length, 1);
    assert.equal(history[0]?.decisionSource, "HUMAN");
    assert.equal(history[0]?.humanActorId, TENANT_A_ACTOR);

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
        admin.$executeRaw(
          Prisma.sql`
            INSERT INTO "hoa_decision_events"
              ("id", "tenantId", "suggestionId", "decision", "decisionSource", "humanActorId")
            VALUES
              ('synthetic-automation-event', ${TENANT_A}, ${persisted[0]!.suggestionId},
               'APPROVED'::"HoaDecision", ${"AUTOMATION"}::"HoaDecisionSource", 'automation')
          `,
        ),
      /invalid input value for enum "HoaDecisionSource"/,
    );

    await admin.$executeRawUnsafe(
      'REVOKE UPDATE, DELETE, TRUNCATE ON "hoa_decision_events" FROM hoa_test_app',
    );
    await admin.$executeRawUnsafe(
      'GRANT UPDATE, DELETE, TRUNCATE ON "hoa_decision_events" TO hoa_test_app',
    );

    // @positive-control(hoa-decision-events-append-only)
    await assert.rejects(
      () =>
        runAsTenant(app, TENANT_A, (transaction) =>
          transaction.$executeRaw(
            Prisma.sql`
              UPDATE "hoa_decision_events"
              SET "rationale" = 'policy_verified'
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
    await assert.rejects(
      () => app.$executeRawUnsafe('TRUNCATE TABLE "hoa_decision_events"'),
      /hoa_decision_events is append-only/,
    );

    const unchangedHistory = await persistence.listDecisionHistory(
      memberA,
      persisted[0].suggestionId,
    );
    assert.deepEqual(unchangedHistory, history);

    await persistence.recordHumanDecision(memberA, {
      suggestionId: persisted[0].suggestionId,
      decision: persistence.HoaDecision.REJECTED,
      rationaleCode: "manager_review_complete",
    });
    await assert.rejects(
      () =>
        persistence.requireHumanApprovedSuggestion(
          memberA,
          persisted[0]!.suggestionId,
        ),
      (error: unknown) =>
        error instanceof persistence.HoaPersistenceError &&
        error.code === "approval_required",
    );

    // @positive-control(hoa-stale-approval-capability)
    let staleCapabilityRejected = false;
    let staleCapabilityActionRan = false;
    try {
      await persistence.resolveHumanApprovalCapability(
        approval,
        async () => {
          staleCapabilityActionRan = true;
        },
      );
    } catch (error) {
      staleCapabilityRejected =
        error instanceof persistence.HoaPersistenceError &&
        error.code === "approval_required";
    }
    console.log(
      `JERRY_DISCONFIRMATION fresh_lookup=REJECTED stale_capability=${staleCapabilityRejected ? "REJECTED" : "AUTHORIZED"}`,
    );
    assert.equal(staleCapabilityRejected, true);
    assert.equal(staleCapabilityActionRan, false);

    const rawIdPipeline = runPipeline([
      {
        id: RAW_PROBE,
        channel: "web_form",
        submittedAt: "2026-08-16T00:00:00.000Z",
        subject: "Pool gate follow-up",
        body: "The pool gate needs maintenance.",
        expectedPiiKinds: [],
      },
    ]);
    const rawIdPersisted = await persistence.persistCaseSuggestion(
      memberB,
      rawIdPipeline.tickets[0]!,
    );
    const transformedSource = await persistence.getCaseForTenant(
      memberB,
      rawIdPersisted.caseId,
    );
    assert.match(transformedSource.sourceTicketId, /^src_[A-Za-z0-9_-]{43}$/u);
    assert.notEqual(transformedSource.sourceTicketId, RAW_PROBE);

    const completeRows = await admin.$transaction(async (transaction) => ({
      cases: await transaction.hoaCase.findMany({
        where: { tenantId: { in: [TENANT_A, TENANT_B] } },
      }),
      suggestions: await transaction.hoaClassifierSuggestion.findMany({
        where: { tenantId: { in: [TENANT_A, TENANT_B] } },
      }),
      decisions: await transaction.hoaDecisionEvent.findMany({
        where: { tenantId: { in: [TENANT_A, TENANT_B] } },
      }),
    }));
    const persistedReadback = JSON.stringify(completeRows);
    const knownRawValues = [
      RAW_PROBE,
      ...corpus.flatMap((ticket) => [
        ticket.resident?.name,
        ticket.resident?.email,
        ticket.resident?.phone,
        ticket.property?.streetAddress,
        ticket.accountReference,
      ]),
    ].filter((value): value is string => Boolean(value && value.length >= 4));
    for (const rawValue of knownRawValues) {
      assert.equal(
        persistedReadback
          .toLocaleLowerCase()
          .includes(rawValue.toLocaleLowerCase()),
        false,
        `persisted row contains raw identifier: ${rawValue}`,
      );
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
      `EVIDENCE verified_tenant_isolation tenant_a_case=${persisted[0].caseId} tenant_b_authenticated_literal_case_id=BLOCKED tenant_b_direct_rows=0`,
    );
    console.log(
      `EVIDENCE approval_flow synthetic=${corpus.length} pending_before=${pendingBefore.length} decisions=3 pending_after=${pendingAfter.length} authenticated_human_actor=${TENANT_A_ACTOR} forged_approval=REJECTED direct_insert=REJECTED stale_capability=REJECTED`,
    );
    console.log(
      "EVIDENCE append_only_after_regrant update=REJECTED delete=REJECTED truncate=REJECTED history_unchanged=true",
    );
    console.log(
      `EVIDENCE redacted_full_row_readback raw_identifier_leaks=0 cases=${completeRows.cases.length} suggestions=${completeRows.suggestions.length} decisions=${completeRows.decisions.length} source_id=TRANSFORMED suggestion_provenance=ENFORCED rationale=BOUNDED`,
    );
    console.log(
      "JERRY_GREEN raw_source_ticket_id=TRANSFORMED raw_reason_code=REJECTED tenant_context=VERIFIED_MEMBERSHIP automation_actor=REJECTED approval_proof=OPAQUE_CAPABILITY",
    );
  } finally {
    await Promise.all([admin.$disconnect(), app.$disconnect()]);
  }
});
