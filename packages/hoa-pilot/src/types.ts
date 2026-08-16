export const TICKET_CHANNELS = ["csv_export", "email", "web_form"] as const;

export type TicketChannel = (typeof TICKET_CHANNELS)[number];

export type SyntheticPiiKind =
  | "account_reference"
  | "email"
  | "gate_code"
  | "license_plate"
  | "person_name"
  | "phone"
  | "ssn"
  | "street_address"
  | "unit";

export interface RawHoaTicket {
  id: string;
  channel: TicketChannel;
  submittedAt: string;
  subject: string;
  body: string;
  resident?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  property?: {
    streetAddress?: string;
    unit?: string;
  };
  accountReference?: string;
  expectedPiiKinds: SyntheticPiiKind[];
}

export interface NormalizedHoaTicket {
  id: string;
  channel: TicketChannel;
  submittedAt: string;
  subject: string;
  body: string;
  knownIdentifiers: ReadonlyArray<{
    kind: SyntheticPiiKind;
    value: string;
  }>;
}

export interface RedactedHoaTicket {
  id: string;
  channel: TicketChannel;
  submittedAt: string;
  subject: string;
  body: string;
  redactionCount: number;
  redactionKinds: SyntheticPiiKind[];
}

export const SUGGESTED_CATEGORIES = [
  "architectural_request",
  "billing_or_dues",
  "maintenance",
  "records_request",
  "rule_or_violation",
  "uncategorized",
] as const;

export type SuggestedCategory = (typeof SUGGESTED_CATEGORIES)[number];

export const SUGGESTED_URGENCIES = ["emergency", "high", "normal"] as const;

export type SuggestedUrgency = (typeof SUGGESTED_URGENCIES)[number];

export const SUGGESTED_OWNERS = [
  "accounting",
  "board_or_manager_review",
  "maintenance_coordinator",
  "property_manager",
] as const;

export type SuggestedOwner = (typeof SUGGESTED_OWNERS)[number];

export const CLASSIFIER_REASON_CODES = [
  "architectural_keyword",
  "billing_keyword",
  "default_priority",
  "emergency_keyword",
  "high_priority_keyword",
  "maintenance_keyword",
  "no_category_keyword",
  "records_keyword",
  "rule_keyword",
] as const;

export type ClassifierReasonCode = (typeof CLASSIFIER_REASON_CODES)[number];

export interface ClassifierSuggestion {
  ticketId: string;
  category: SuggestedCategory;
  urgency: SuggestedUrgency;
  suggestedOwner: SuggestedOwner;
  decisionMode: "suggestion_only";
  reasonCodes: ClassifierReasonCode[];
}

export interface PipelineResult {
  intake: {
    input: number;
    normalized: number;
    rejected: number;
  };
  redaction: {
    input: number;
    redactedTickets: number;
    cleanPassthrough: number;
    blocked: number;
    replacements: number;
  };
  classification: {
    input: number;
    classified: number;
    suggestionOnly: number;
  };
  tickets: Array<{
    redacted: RedactedHoaTicket;
    suggestion: ClassifierSuggestion;
  }>;
}
