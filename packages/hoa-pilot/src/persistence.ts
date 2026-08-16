import {
  HoaDecision,
  HoaDecisionSource,
  Prisma,
  type PrismaClient,
} from "@client/database";

import {
  assertRedactedTicketProvenance,
  assertSafeForClassification,
} from "./redaction.js";
import type { ClassifierSuggestion, RedactedHoaTicket } from "./types.js";

type TenantTransaction = Prisma.TransactionClient;

export interface PersistCaseSuggestionInput {
  tenantId: string;
  redacted: RedactedHoaTicket;
  suggestion: ClassifierSuggestion;
}

export interface HumanDecisionInput {
  tenantId: string;
  suggestionId: string;
  decision: HoaDecision;
  humanActorId: string;
  rationale?: string;
}

export interface HumanApprovedSuggestion {
  tenantId: string;
  suggestionId: string;
  decisionEventId: string;
  humanActorId: string;
}

export class HoaPersistenceError extends Error {
  constructor(
    readonly code: "approval_required" | "invalid_input" | "not_found",
    message: string,
  ) {
    super(message);
    this.name = "HoaPersistenceError";
  }
}

function requireNonEmpty(value: string, field: string): string {
  const normalized = value.trim();

  if (normalized.length === 0) {
    throw new HoaPersistenceError(
      "invalid_input",
      `${field} must be a non-empty string`,
    );
  }

  return normalized;
}

async function withTenantTransaction<T>(
  prisma: PrismaClient,
  tenantIdInput: string,
  operation: (transaction: TenantTransaction, tenantId: string) => Promise<T>,
): Promise<T> {
  const tenantId = requireNonEmpty(tenantIdInput, "tenantId");

  return prisma.$transaction(async (transaction) => {
    await transaction.$executeRaw(
      Prisma.sql`SELECT set_config('app.tenant_id', ${tenantId}, true)`,
    );

    return operation(transaction, tenantId);
  });
}

export async function persistCaseSuggestion(
  prisma: PrismaClient,
  input: PersistCaseSuggestionInput,
): Promise<{ caseId: string; suggestionId: string }> {
  assertRedactedTicketProvenance(input.redacted);
  assertSafeForClassification(
    `${input.redacted.subject}\n${input.redacted.body}`,
  );

  if (
    input.suggestion.decisionMode !== "suggestion_only" ||
    input.suggestion.ticketId !== input.redacted.id
  ) {
    throw new HoaPersistenceError(
      "invalid_input",
      "Only a matching suggestion-only classifier result may be persisted",
    );
  }

  return withTenantTransaction(
    prisma,
    input.tenantId,
    async (transaction, tenantId) => {
      const hoaCase = await transaction.hoaCase.create({
        data: {
          tenantId,
          sourceTicketId: input.redacted.id,
          channel: input.redacted.channel,
          submittedAt: new Date(input.redacted.submittedAt),
          redactedSubject: input.redacted.subject,
          redactedBody: input.redacted.body,
          redactionCount: input.redacted.redactionCount,
          redactionKinds: input.redacted.redactionKinds,
        },
      });
      const suggestion = await transaction.hoaClassifierSuggestion.create({
        data: {
          tenantId,
          caseId: hoaCase.id,
          category: input.suggestion.category,
          urgency: input.suggestion.urgency,
          suggestedOwner: input.suggestion.suggestedOwner,
          reasonCodes: input.suggestion.reasonCodes,
        },
      });

      return { caseId: hoaCase.id, suggestionId: suggestion.id };
    },
  );
}

export async function getCaseForTenant(
  prisma: PrismaClient,
  tenantId: string,
  caseIdInput: string,
) {
  const caseId = requireNonEmpty(caseIdInput, "caseId");

  return withTenantTransaction(
    prisma,
    tenantId,
    async (transaction, scopedTenantId) => {
      const hoaCase = await transaction.hoaCase.findFirst({
        where: { id: caseId, tenantId: scopedTenantId },
      });

      if (!hoaCase) {
        throw new HoaPersistenceError(
          "not_found",
          "HOA case was not found in the active tenant",
        );
      }

      return hoaCase;
    },
  );
}

export async function listPendingApprovals(
  prisma: PrismaClient,
  tenantId: string,
) {
  return withTenantTransaction(
    prisma,
    tenantId,
    (transaction, scopedTenantId) =>
      transaction.hoaClassifierSuggestion.findMany({
        where: {
          tenantId: scopedTenantId,
          decisionEvents: { none: {} },
        },
        include: { hoaCase: true },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      }),
  );
}

export async function recordHumanDecision(
  prisma: PrismaClient,
  input: HumanDecisionInput,
) {
  const suggestionId = requireNonEmpty(input.suggestionId, "suggestionId");
  const humanActorId = requireNonEmpty(input.humanActorId, "humanActorId");
  const rationale = input.rationale?.trim() || undefined;

  return withTenantTransaction(
    prisma,
    input.tenantId,
    async (transaction, tenantId) => {
      const suggestion = await transaction.hoaClassifierSuggestion.findFirst({
        where: { id: suggestionId, tenantId },
        select: { id: true },
      });

      if (!suggestion) {
        throw new HoaPersistenceError(
          "not_found",
          "HOA classifier suggestion was not found in the active tenant",
        );
      }

      return transaction.hoaDecisionEvent.create({
        data: {
          tenantId,
          suggestionId,
          decision: input.decision,
          decisionSource: HoaDecisionSource.HUMAN,
          humanActorId,
          rationale,
        },
      });
    },
  );
}

export async function listDecisionHistory(
  prisma: PrismaClient,
  tenantId: string,
  suggestionIdInput: string,
) {
  const suggestionId = requireNonEmpty(suggestionIdInput, "suggestionId");

  return withTenantTransaction(
    prisma,
    tenantId,
    (transaction, scopedTenantId) =>
      transaction.hoaDecisionEvent.findMany({
        where: { suggestionId, tenantId: scopedTenantId },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      }),
  );
}

export async function requireHumanApprovedSuggestion(
  prisma: PrismaClient,
  tenantId: string,
  suggestionIdInput: string,
): Promise<HumanApprovedSuggestion> {
  const suggestionId = requireNonEmpty(suggestionIdInput, "suggestionId");

  return withTenantTransaction(
    prisma,
    tenantId,
    async (transaction, scopedTenantId) => {
      const suggestion = await transaction.hoaClassifierSuggestion.findFirst({
        where: { id: suggestionId, tenantId: scopedTenantId },
        include: {
          decisionEvents: {
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            take: 1,
          },
        },
      });
      const decision = suggestion?.decisionEvents[0];

      if (
        !decision ||
        decision.decision !== HoaDecision.APPROVED ||
        decision.decisionSource !== HoaDecisionSource.HUMAN
      ) {
        // @fail-closed(hoa-human-approval-required)
        throw new HoaPersistenceError(
          "approval_required",
          "A current human approval decision is required",
        );
      }

      return Object.freeze({
        tenantId: scopedTenantId,
        suggestionId,
        decisionEventId: decision.id,
        humanActorId: decision.humanActorId,
      });
    },
  );
}

export { HoaDecision };
