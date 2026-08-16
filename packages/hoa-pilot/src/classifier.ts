import {
  assertRedactedTicketProvenance,
  assertSafeForClassification,
} from "./redaction.js";
import type {
  ClassifierSuggestion,
  ClassifierReasonCode,
  RedactedHoaTicket,
  SuggestedCategory,
  SuggestedUrgency,
} from "./types.js";

const CATEGORY_RULES: Array<{
  category: SuggestedCategory;
  pattern: RegExp;
  reasonCode: ClassifierReasonCode;
}> = [
  {
    category: "records_request",
    pattern: /\b(?:record|document|minutes|ledger|inspection)\b/iu,
    reasonCode: "records_keyword",
  },
  {
    category: "architectural_request",
    pattern: /\b(?:architectural|paint|fence|patio|solar|window)\b/iu,
    reasonCode: "architectural_keyword",
  },
  {
    category: "billing_or_dues",
    pattern: /\b(?:account|assessment|balance|charge|dues|fee|payment)\b/iu,
    reasonCode: "billing_keyword",
  },
  {
    category: "rule_or_violation",
    pattern: /\b(?:noise|parking|pet|rule|violation|warning)\b/iu,
    reasonCode: "rule_keyword",
  },
  {
    category: "maintenance",
    pattern:
      /\b(?:air conditioning|elevator|flood|gate|irrigation|leak|light|mold|pool|repair|roof|sprinkler|trash|water)\b/iu,
    reasonCode: "maintenance_keyword",
  },
];

function suggestUrgency(text: string): {
  urgency: SuggestedUrgency;
  reasonCode: ClassifierReasonCode;
} {
  if (
    /\b(?:active fire|gas smell|medical emergency|sparking|uncontrolled flooding)\b/iu.test(
      text,
    )
  ) {
    return { urgency: "emergency", reasonCode: "emergency_keyword" };
  }

  if (/\b(?:burst|flood|leak|no water|security gate|urgent)\b/iu.test(text)) {
    return { urgency: "high", reasonCode: "high_priority_keyword" };
  }

  return { urgency: "normal", reasonCode: "default_priority" };
}

const CLASSIFIER_SUGGESTION_PROVENANCE = new WeakSet<ClassifierSuggestion>();

export function assertClassifierSuggestionProvenance(
  suggestion: ClassifierSuggestion,
): void {
  if (!CLASSIFIER_SUGGESTION_PROVENANCE.has(suggestion)) {
    // @fail-closed(hoa-persistence-suggestion-provenance)
    throw new Error(
      "Persistence boundary rejected a suggestion that did not come from classifyTicket",
    );
  }
}

export function classifyTicket(
  ticket: RedactedHoaTicket,
): ClassifierSuggestion {
  assertRedactedTicketProvenance(ticket);
  const text = `${ticket.subject}\n${ticket.body}`;
  assertSafeForClassification(text);

  const categoryMatch = CATEGORY_RULES.find((rule) => rule.pattern.test(text));
  const category = categoryMatch?.category ?? "uncategorized";
  const urgency = suggestUrgency(text);

  const suggestedOwner =
    category === "billing_or_dues"
      ? "accounting"
      : category === "maintenance"
        ? "maintenance_coordinator"
        : category === "architectural_request" ||
            category === "rule_or_violation"
          ? "board_or_manager_review"
          : "property_manager";

  const suggestion: ClassifierSuggestion = {
    ticketId: ticket.id,
    category,
    urgency: urgency.urgency,
    suggestedOwner,
    decisionMode: "suggestion_only",
    reasonCodes: [
      categoryMatch?.reasonCode ?? "no_category_keyword",
      urgency.reasonCode,
    ],
  };

  Object.freeze(suggestion.reasonCodes);
  Object.freeze(suggestion);
  CLASSIFIER_SUGGESTION_PROVENANCE.add(suggestion);

  return suggestion;
}
