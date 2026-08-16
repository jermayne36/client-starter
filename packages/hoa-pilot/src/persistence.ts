import { createHash, randomUUID } from "node:crypto";

import {
  HoaDecision,
  HoaDecisionSource,
  Prisma,
  type PrismaClient,
} from "@client/database";

import { assertClassifierSuggestionProvenance } from "./classifier.js";
import {
  assertRedactedTicketProvenance,
  assertSafeForClassification,
} from "./redaction.js";
import type { ClassifierSuggestion, RedactedHoaTicket } from "./types.js";

type TenantTransaction = Prisma.TransactionClient;

declare const HOA_MEMBERSHIP_CAPABILITY: unique symbol;
declare const HOA_APPROVAL_CAPABILITY: unique symbol;

export type HoaMembershipCapability = Readonly<{
  [HOA_MEMBERSHIP_CAPABILITY]: true;
}>;

export type HumanApprovalCapability = Readonly<{
  [HOA_APPROVAL_CAPABILITY]: true;
}>;

export const HUMAN_DECISION_RATIONALE_CODES = [
  "insufficient_information",
  "manager_review_complete",
  "policy_verified",
] as const;

export type HumanDecisionRationaleCode =
  (typeof HUMAN_DECISION_RATIONALE_CODES)[number];

export interface PersistCaseSuggestionInput {
  redacted: RedactedHoaTicket;
  suggestion: ClassifierSuggestion;
}

export interface HumanDecisionInput {
  suggestionId: string;
  decision: HoaDecision;
  rationaleCode?: HumanDecisionRationaleCode;
}

interface HumanApprovalReceipt {
  tenantId: string;
  suggestionId: string;
  decisionEventId: string;
  humanActorId: string;
}

type MembershipCapabilityState = {
  prisma: PrismaClient;
  tokenHash: string;
};

type VerifiedMembership = {
  tenantId: string;
  humanActorId: string;
};

const MEMBERSHIP_CAPABILITIES = new WeakMap<
  object,
  MembershipCapabilityState
>();
const APPROVAL_CAPABILITIES = new WeakMap<object, HumanApprovalReceipt>();

export class HoaPersistenceError extends Error {
  constructor(
    readonly code:
      | "approval_required"
      | "authentication_required"
      | "invalid_input"
      | "not_found",
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

function accessTokenHash(accessToken: string): string {
  return createHash("sha256").update(accessToken, "utf8").digest("hex");
}

function opaqueSourceTicketId(sourceTicketId: string): string {
  return `src_${createHash("sha256")
    .update(sourceTicketId, "utf8")
    .digest("base64url")}`;
}

function requireMembershipCapability(
  capability: HoaMembershipCapability,
): MembershipCapabilityState {
  const state = MEMBERSHIP_CAPABILITIES.get(capability);

  if (!state) {
    // @fail-closed(hoa-membership-capability)
    throw new HoaPersistenceError(
      "authentication_required",
      "A verified HOA membership capability is required",
    );
  }

  return state;
}

async function lookupVerifiedMembership(
  transaction: PrismaClient | TenantTransaction,
  tokenHash: string,
): Promise<VerifiedMembership> {
  const memberships = await transaction.$queryRaw<VerifiedMembership[]>(
    Prisma.sql`
      SELECT "tenantId", "humanActorId"
      FROM "lookup_hoa_membership"(${tokenHash})
    `,
  );
  const membership = memberships[0];

  if (!membership) {
    // @fail-closed(hoa-membership-authentication)
    throw new HoaPersistenceError(
      "authentication_required",
      "The HOA membership credential is invalid",
    );
  }

  return membership;
}

export async function authenticateHoaMembership(
  prisma: PrismaClient,
  membershipAccessToken: string,
): Promise<HoaMembershipCapability> {
  const tokenHash = accessTokenHash(
    requireNonEmpty(membershipAccessToken, "membershipAccessToken"),
  );
  await lookupVerifiedMembership(prisma, tokenHash);

  const capability = Object.freeze({}) as HoaMembershipCapability;
  MEMBERSHIP_CAPABILITIES.set(capability, { prisma, tokenHash });
  return capability;
}

async function withTenantTransaction<T>(
  capability: HoaMembershipCapability,
  operation: (
    transaction: TenantTransaction,
    membership: VerifiedMembership,
    tokenHash: string,
  ) => Promise<T>,
): Promise<T> {
  const state = requireMembershipCapability(capability);

  return state.prisma.$transaction(async (transaction) => {
    const membership = await lookupVerifiedMembership(
      transaction,
      state.tokenHash,
    );
    await transaction.$executeRaw(
      Prisma.sql`SELECT set_config('app.tenant_id', ${membership.tenantId}, true)`,
    );

    return operation(transaction, membership, state.tokenHash);
  });
}

export async function persistCaseSuggestion(
  membership: HoaMembershipCapability,
  input: PersistCaseSuggestionInput,
): Promise<{ caseId: string; suggestionId: string }> {
  assertRedactedTicketProvenance(input.redacted);
  assertClassifierSuggestionProvenance(input.suggestion);
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
    membership,
    async (transaction, verifiedMembership) => {
      const hoaCase = await transaction.hoaCase.create({
        data: {
          tenantId: verifiedMembership.tenantId,
          sourceTicketId: opaqueSourceTicketId(input.redacted.id),
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
          tenantId: verifiedMembership.tenantId,
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
  membership: HoaMembershipCapability,
  caseIdInput: string,
) {
  const caseId = requireNonEmpty(caseIdInput, "caseId");

  return withTenantTransaction(
    membership,
    async (transaction, verifiedMembership) => {
      const hoaCase = await transaction.hoaCase.findFirst({
        where: { id: caseId, tenantId: verifiedMembership.tenantId },
      });

      if (!hoaCase) {
        throw new HoaPersistenceError(
          "not_found",
          "HOA case was not found in the verified tenant",
        );
      }

      return hoaCase;
    },
  );
}

export async function listPendingApprovals(
  membership: HoaMembershipCapability,
) {
  return withTenantTransaction(membership, (transaction, verifiedMembership) =>
    transaction.hoaClassifierSuggestion.findMany({
      where: {
        tenantId: verifiedMembership.tenantId,
        decisionEvents: { none: {} },
      },
      include: { hoaCase: true },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    }),
  );
}

export async function recordHumanDecision(
  membership: HoaMembershipCapability,
  input: HumanDecisionInput,
) {
  const suggestionId = requireNonEmpty(input.suggestionId, "suggestionId");
  const rationaleCode = input.rationaleCode ?? null;

  if (
    rationaleCode !== null &&
    !HUMAN_DECISION_RATIONALE_CODES.includes(rationaleCode)
  ) {
    // @fail-closed(hoa-decision-rationale-code)
    throw new HoaPersistenceError(
      "invalid_input",
      "Decision rationale must use a bounded rationale code",
    );
  }

  return withTenantTransaction(
    membership,
    async (transaction, _verifiedMembership, tokenHash) => {
      const eventId = randomUUID();
      await transaction.$queryRaw(
        Prisma.sql`
          SELECT "tenantId", "humanActorId"
          FROM "record_hoa_human_decision"(
            ${eventId},
            ${tokenHash},
            ${suggestionId},
            ${input.decision}::"HoaDecision",
            ${rationaleCode}
          )
        `,
      );

      return transaction.hoaDecisionEvent.findUniqueOrThrow({
        where: { id: eventId },
      });
    },
  );
}

export async function listDecisionHistory(
  membership: HoaMembershipCapability,
  suggestionIdInput: string,
) {
  const suggestionId = requireNonEmpty(suggestionIdInput, "suggestionId");

  return withTenantTransaction(membership, (transaction, verifiedMembership) =>
    transaction.hoaDecisionEvent.findMany({
      where: { suggestionId, tenantId: verifiedMembership.tenantId },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    }),
  );
}

export async function requireHumanApprovedSuggestion(
  membership: HoaMembershipCapability,
  suggestionIdInput: string,
): Promise<HumanApprovalCapability> {
  const suggestionId = requireNonEmpty(suggestionIdInput, "suggestionId");

  return withTenantTransaction(
    membership,
    async (transaction, verifiedMembership) => {
      const suggestion = await transaction.hoaClassifierSuggestion.findFirst({
        where: { id: suggestionId, tenantId: verifiedMembership.tenantId },
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
          "A current verified human approval decision is required",
        );
      }

      const capability = Object.freeze({}) as HumanApprovalCapability;
      APPROVAL_CAPABILITIES.set(
        capability,
        Object.freeze({
          tenantId: verifiedMembership.tenantId,
          suggestionId,
          decisionEventId: decision.id,
          humanActorId: decision.humanActorId,
        }),
      );
      return capability;
    },
  );
}

export function resolveHumanApprovalCapability(
  capability: unknown,
): HumanApprovalReceipt {
  if (
    typeof capability !== "object" ||
    capability === null ||
    !APPROVAL_CAPABILITIES.has(capability)
  ) {
    // @fail-closed(hoa-approval-capability)
    throw new HoaPersistenceError(
      "approval_required",
      "A non-forgeable human approval capability is required",
    );
  }

  return APPROVAL_CAPABILITIES.get(capability)!;
}

export { HoaDecision };
