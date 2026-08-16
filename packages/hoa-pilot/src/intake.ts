import {
  TICKET_CHANNELS,
  type NormalizedHoaTicket,
  type RawHoaTicket,
  type SyntheticPiiKind,
} from "./types.js";

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;

function requireString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(
      `Invalid synthetic ticket: ${field} must be a non-empty string`,
    );
  }

  return value.trim();
}

export function normalizeTicket(ticket: RawHoaTicket): NormalizedHoaTicket {
  const id = requireString(ticket.id, "id");
  const submittedAt = requireString(ticket.submittedAt, "submittedAt");
  const subject = requireString(ticket.subject, "subject");
  const body = requireString(ticket.body, "body");

  if (!TICKET_CHANNELS.includes(ticket.channel)) {
    throw new Error(`Invalid synthetic ticket ${id}: unsupported channel`);
  }

  if (!ISO_DATE_PATTERN.test(submittedAt)) {
    throw new Error(
      `Invalid synthetic ticket ${id}: submittedAt must be UTC ISO-8601`,
    );
  }

  const identifierCandidates: Array<{
    kind: SyntheticPiiKind;
    value: string | undefined;
  }> = [
    { kind: "person_name", value: ticket.resident?.name },
    { kind: "email", value: ticket.resident?.email },
    { kind: "phone", value: ticket.resident?.phone },
    { kind: "street_address", value: ticket.property?.streetAddress },
    { kind: "unit", value: ticket.property?.unit },
    { kind: "account_reference", value: ticket.accountReference },
  ];
  const identifiers: NormalizedHoaTicket["knownIdentifiers"] =
    identifierCandidates.flatMap(({ kind, value }) =>
      typeof value === "string" && value.trim().length > 0
        ? [{ kind, value: value.trim() }]
        : [],
    );

  return {
    id,
    channel: ticket.channel,
    submittedAt,
    subject,
    body,
    knownIdentifiers: identifiers,
  };
}
