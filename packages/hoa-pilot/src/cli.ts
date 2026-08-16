import { loadSyntheticCorpus } from "./corpus.js";
import { normalizeTicket } from "./intake.js";
import { assertSafeForClassification } from "./redaction.js";
import { runPipeline } from "./pipeline.js";

const corpus = await loadSyntheticCorpus();
const result = runPipeline(corpus);
const piiFixture = corpus.find((ticket) => ticket.expectedPiiKinds.length > 0);
const cleanFixture = corpus.find(
  (ticket) => ticket.expectedPiiKinds.length === 0,
);

if (!piiFixture || !cleanFixture) {
  throw new Error(
    "Synthetic corpus must contain both PII and clean positive controls",
  );
}

const rawPositiveControl = normalizeTicket(piiFixture);
let rawRejection = "ERROR: raw PII unexpectedly passed";

try {
  assertSafeForClassification(
    `${rawPositiveControl.subject}\n${rawPositiveControl.body}`,
  );
} catch (error) {
  rawRejection =
    error instanceof Error ? error.message : "Unknown redaction error";
}

const redactedExample = result.tickets.find(
  ({ redacted }) => redacted.id === piiFixture.id,
);
const cleanExample = result.tickets.find(
  ({ redacted }) => redacted.id === cleanFixture.id,
);

console.log("HOA PILOT PHASE 1 — SYNTHETIC CORPUS");
console.log(`corpus: tickets=${corpus.length}`);
console.log(
  `intake: in=${result.intake.input} normalized=${result.intake.normalized} rejected=${result.intake.rejected}`,
);
console.log(
  `redaction: in=${result.redaction.input} redacted_tickets=${result.redaction.redactedTickets} clean_passthrough=${result.redaction.cleanPassthrough} blocked=${result.redaction.blocked} replacements=${result.redaction.replacements}`,
);
console.log(
  `classifier_stub: in=${result.classification.input} classified=${result.classification.classified} suggestion_only=${result.classification.suggestionOnly}`,
);
console.log("positive_control_raw_classifier_boundary:");
console.log(`  ticket=${piiFixture.id} result=BLOCKED reason=${rawRejection}`);
console.log("positive_control_redacted:");
console.log(
  `  ticket=${piiFixture.id} kinds=${redactedExample?.redacted.redactionKinds.join(",")}`,
);
console.log(`  subject=${redactedExample?.redacted.subject}`);
console.log(`  body=${redactedExample?.redacted.body}`);
console.log("clean_passthrough_control:");
console.log(
  `  ticket=${cleanFixture.id} replacements=${cleanExample?.redacted.redactionCount}`,
);
console.log(`  body=${cleanExample?.redacted.body}`);
