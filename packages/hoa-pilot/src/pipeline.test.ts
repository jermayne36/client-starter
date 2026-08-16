import assert from "node:assert/strict";
import test from "node:test";

import { classifyTicket } from "./classifier.js";
import { positiveControlExitCode } from "./cli-control.js";
import { loadSyntheticCorpus } from "./corpus.js";
import { normalizeTicket } from "./intake.js";
import { assertSafeForClassification, redactTicket } from "./redaction.js";
import { runPipeline } from "./pipeline.js";
import type {
  NormalizedHoaTicket,
  RedactedHoaTicket,
  SyntheticPiiKind,
} from "./types.js";

const GENERIC_PII_FIXTURES: ReadonlyArray<{
  kind: Exclude<SyntheticPiiKind, "person_name" | "unit">;
  raw: string;
  token: string;
}> = [
  {
    kind: "email",
    raw: "Reply to resident@example.test today",
    token: "[EMAIL]",
  },
  {
    kind: "phone",
    raw: "Call resident at 7025550101",
    token: "[PHONE]",
  },
  {
    kind: "ssn",
    raw: "SSN 123 45 6789 was attached",
    token: "[SSN]",
  },
  {
    kind: "street_address",
    raw: "The owner lives at 1842 Juniper Ridge Drive",
    token: "[STREET_ADDRESS]",
  },
  {
    kind: "license_plate",
    raw: "License NV7XK921 blocks the lane",
    token: "[LICENSE_PLATE]",
  },
  {
    kind: "gate_code",
    raw: "Gate PIN 4821 is broken",
    token: "[GATE_CODE]",
  },
  {
    kind: "account_reference",
    raw: "HOA account LL-48291 needs review",
    token: "[ACCOUNT_REFERENCE]",
  },
];

function normalizedFixture(
  body: string,
  knownIdentifiers: NormalizedHoaTicket["knownIdentifiers"] = [],
): NormalizedHoaTicket {
  return {
    id: "HOA-TEST",
    channel: "email",
    submittedAt: "2026-08-15T00:00:00Z",
    subject: "Synthetic fixture",
    body,
    knownIdentifiers,
  };
}

test("synthetic corpus has at least 50 varied tickets and both privacy controls", async () => {
  const corpus = await loadSyntheticCorpus();
  const channels = new Set(corpus.map((ticket) => ticket.channel));

  assert.ok(corpus.length >= 50);
  assert.equal(new Set(corpus.map((ticket) => ticket.id)).size, corpus.length);
  assert.equal(channels.size, 3);
  assert.ok(corpus.some((ticket) => ticket.expectedPiiKinds.length > 0));
  assert.ok(corpus.some((ticket) => ticket.expectedPiiKinds.length === 0));
});

test("positive control blocks unredacted PII at classifier boundary", async () => {
  // @positive-control(hoa-residual-pii)
  const corpus = await loadSyntheticCorpus();
  const fixture = corpus.find((ticket) => ticket.id === "HOA-SYN-001");
  assert.ok(fixture);

  const normalized = normalizeTicket(fixture);
  assert.throws(
    () =>
      assertSafeForClassification(`${normalized.subject}\n${normalized.body}`),
    /Redaction gate blocked classifier boundary/,
  );
});

for (const fixture of GENERIC_PII_FIXTURES) {
  test(`generic ${fixture.kind} detector blocks and masks its isolated raw fixture`, () => {
    const normalized = normalizedFixture(fixture.raw);

    assert.throws(
      () =>
        assertSafeForClassification(
          `${normalized.subject}\n${normalized.body}`,
        ),
      new RegExp(fixture.kind),
    );

    const redacted = redactTicket(normalized);
    assert.ok(redacted.redactionKinds.includes(fixture.kind));
    assert.ok(redacted.body.includes(fixture.token));
    assert.doesNotThrow(() => classifyTicket(redacted));
  });
}

test("generic unit detector masks same-line labels and never crosses newlines", () => {
  const sameLine = normalizedFixture(
    "Work is at Unit 204 and the mailbox is at Unit # 4B",
  );
  const ordinaryNewline = normalizedFixture(
    "The leak is near my unit\nWater is entering the hall.",
  );
  const splitIdentifier = normalizedFixture(
    "Work is at Unit\n204 and needs review.",
  );

  assert.throws(() => assertSafeForClassification(sameLine.body), /unit/);
  const redacted = redactTicket(sameLine);
  assert.equal(redacted.body.match(/\[UNIT\]/gu)?.length, 2);
  assert.ok(redacted.redactionKinds.includes("unit"));

  for (const negative of [ordinaryNewline, splitIdentifier]) {
    const unchanged = redactTicket(negative);
    assert.equal(unchanged.body, negative.body);
    assert.equal(unchanged.redactionKinds.includes("unit"), false);
    assert.doesNotThrow(() => assertSafeForClassification(negative.body));
  }
});

const FORGED_RAW_BOUNDARY_PROBES = [
  "Elena Marquez requests a paint review",
  "Call resident at 7025550101",
  "SSN 123 45 6789 was attached",
  "License NV7XK921 blocks lane",
  "Gate PIN 4821 is broken",
] as const;

for (const body of FORGED_RAW_BOUNDARY_PROBES) {
  test(`classifier rejects forged raw boundary: ${body}`, () => {
    // @positive-control(hoa-classifier-redaction-provenance)
    const forgedTicket: RedactedHoaTicket = {
      id: "HOA-FORGED",
      channel: "email",
      submittedAt: "2026-08-15T00:00:00Z",
      subject: "Synthetic forged payload",
      body,
      redactionCount: 0,
      redactionKinds: [],
    };

    assert.throws(
      () => classifyTicket(forgedTicket),
      /did not come from redactTicket/,
    );
  });
}

test("redacted classifier input is immutable and loses provenance when copied", () => {
  const redacted = redactTicket(
    normalizedFixture("A clean maintenance request"),
  );
  const copied = { ...redacted };

  assert.equal(Object.isFrozen(redacted), true);
  assert.equal(Object.isFrozen(redacted.redactionKinds), true);
  assert.doesNotThrow(() => classifyTicket(redacted));
  assert.throws(() => classifyTicket(copied), /did not come from redactTicket/);
});

test("kind-aware exact matching preserves collateral around short names and units", () => {
  const redacted = redactTicket(
    normalizedFixture("Al reported 12 issues in 12 days for unit 12.", [
      { kind: "person_name", value: "Al" },
      { kind: "unit", value: "12" },
    ]),
  );

  assert.equal(
    redacted.body,
    "[PERSON] reported 12 issues in 12 days for [UNIT].",
  );
  assert.deepEqual(redacted.redactionKinds, ["person_name", "unit"]);
});

test("one-character bare known identifiers fail closed instead of masking prose", () => {
  // @positive-control(hoa-short-known-identifier)
  assert.throws(
    () =>
      redactTicket(
        normalizedFixture("A resident reported a problem", [
          { kind: "person_name", value: "A" },
        ]),
      ),
    /too short to redact safely/,
  );
});

test("empty structured unit values fail closed", () => {
  // @positive-control(hoa-empty-known-unit)
  assert.throws(
    () =>
      redactTicket(
        normalizedFixture("Unit information was omitted", [
          { kind: "unit", value: "Unit " },
        ]),
      ),
    /has no unit value/,
  );
});

test("CLI positive control returns non-zero only when the guard fails open", () => {
  // @positive-control(hoa-cli-positive-control)
  assert.equal(positiveControlExitCode(false), 1);
  assert.equal(positiveControlExitCode(true), 0);
});

test("redaction removes structured and free-text HOA identifiers before classification", async () => {
  const corpus = await loadSyntheticCorpus();
  const fixture = corpus.find((ticket) => ticket.id === "HOA-SYN-001");
  assert.ok(fixture);

  const redacted = redactTicket(normalizeTicket(fixture));
  const rendered = JSON.stringify(redacted);

  assert.equal(rendered.includes("Elena Marquez"), false);
  assert.equal(rendered.includes("elena.marquez@example.test"), false);
  assert.equal(rendered.includes("702-555-0101"), false);
  assert.equal(rendered.includes("1842 Juniper Ridge Drive"), false);
  assert.match(rendered, /\[PERSON\]/);
  assert.match(rendered, /\[EMAIL\]/);
  assert.doesNotThrow(() => classifyTicket(redacted));
});

test("clean tickets pass through the redaction stage unchanged", async () => {
  const corpus = await loadSyntheticCorpus();
  const fixture = corpus.find((ticket) => ticket.id === "HOA-SYN-011");
  assert.ok(fixture);

  const normalized = normalizeTicket(fixture);
  const redacted = redactTicket(normalized);

  assert.equal(redacted.subject, normalized.subject);
  assert.equal(redacted.body, normalized.body);
  assert.equal(redacted.redactionCount, 0);
  assert.deepEqual(redacted.redactionKinds, []);
});

test("every annotated synthetic PII class is exercised by the redaction gate", async () => {
  const corpus = await loadSyntheticCorpus();

  for (const fixture of corpus) {
    const redacted = redactTicket(normalizeTicket(fixture));

    for (const expectedKind of fixture.expectedPiiKinds) {
      assert.ok(
        redacted.redactionKinds.includes(expectedKind),
        `${fixture.id} did not exercise ${expectedKind}`,
      );
    }
  }
});

test("pipeline classifies every ticket as a suggestion and emits no raw known identifiers", async () => {
  const corpus = await loadSyntheticCorpus();
  const result = runPipeline(corpus);
  const rendered = JSON.stringify(result.tickets);

  assert.equal(result.intake.input, corpus.length);
  assert.equal(result.intake.normalized, corpus.length);
  assert.equal(result.redaction.input, corpus.length);
  assert.equal(result.classification.classified, corpus.length);
  assert.equal(result.classification.suggestionOnly, corpus.length);

  for (const ticket of corpus) {
    const identifiers = [
      ticket.resident?.name,
      ticket.resident?.email,
      ticket.resident?.phone,
      ticket.property?.streetAddress,
      ticket.property?.unit,
      ticket.accountReference,
    ].filter((value): value is string => Boolean(value));

    for (const identifier of identifiers) {
      assert.equal(
        rendered.includes(identifier),
        false,
        `${ticket.id} leaked ${identifier}`,
      );
    }
  }
});
