import assert from "node:assert/strict";
import test from "node:test";

import { classifyTicket } from "./classifier.js";
import { loadSyntheticCorpus } from "./corpus.js";
import { normalizeTicket } from "./intake.js";
import { assertSafeForClassification, redactTicket } from "./redaction.js";
import { runPipeline } from "./pipeline.js";

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
