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

export type SuggestedCategory =
  | "architectural_request"
  | "billing_or_dues"
  | "maintenance"
  | "records_request"
  | "rule_or_violation"
  | "uncategorized";

export type SuggestedUrgency = "emergency" | "high" | "normal";

export interface ClassifierSuggestion {
  ticketId: string;
  category: SuggestedCategory;
  urgency: SuggestedUrgency;
  suggestedOwner:
    | "accounting"
    | "board_or_manager_review"
    | "maintenance_coordinator"
    | "property_manager";
  decisionMode: "suggestion_only";
  reasonCodes: string[];
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
