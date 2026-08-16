import { classifyTicket } from "./classifier.js";
import { normalizeTicket } from "./intake.js";
import { redactTicket } from "./redaction.js";
import type { PipelineResult, RawHoaTicket } from "./types.js";

export function runPipeline(rawTickets: RawHoaTicket[]): PipelineResult {
  const normalized = rawTickets.map(normalizeTicket);
  const redacted = normalized.map(redactTicket);
  const tickets = redacted.map((ticket) => ({
    redacted: ticket,
    suggestion: classifyTicket(ticket),
  }));

  const redactedTickets = redacted.filter(
    (ticket) => ticket.redactionCount > 0,
  ).length;
  const replacements = redacted.reduce(
    (total, ticket) => total + ticket.redactionCount,
    0,
  );

  return {
    intake: {
      input: rawTickets.length,
      normalized: normalized.length,
      rejected: 0,
    },
    redaction: {
      input: normalized.length,
      redactedTickets,
      cleanPassthrough: redacted.length - redactedTickets,
      blocked: 0,
      replacements,
    },
    classification: {
      input: redacted.length,
      classified: tickets.length,
      suggestionOnly: tickets.filter(
        ({ suggestion }) => suggestion.decisionMode === "suggestion_only",
      ).length,
    },
    tickets,
  };
}
