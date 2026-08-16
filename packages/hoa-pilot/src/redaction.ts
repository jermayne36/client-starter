import type {
  NormalizedHoaTicket,
  RedactedHoaTicket,
  SyntheticPiiKind,
} from "./types.js";

type PiiRule = {
  kind: SyntheticPiiKind;
  pattern: RegExp;
  replacement: string;
};

const PII_RULES: PiiRule[] = [
  {
    kind: "email",
    pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/giu,
    replacement: "[EMAIL]",
  },
  {
    kind: "phone",
    pattern:
      /(?<!\d)(?:\+?1[ .-]?)?(?:\(\d{3}\)|\d{3})[ .-]\d{3}[ .-]\d{4}(?!\d)/gu,
    replacement: "[PHONE]",
  },
  {
    kind: "ssn",
    pattern: /(?<!\d)\d{3}-\d{2}-\d{4}(?!\d)/gu,
    replacement: "[SSN]",
  },
  {
    kind: "street_address",
    pattern:
      /\b\d{1,6}\s+(?:[A-Z0-9.'-]+\s+){0,5}(?:STREET|ST|AVENUE|AVE|ROAD|RD|BOULEVARD|BLVD|DRIVE|DR|LANE|LN|COURT|CT|WAY|PLACE|PL)\b\.?/giu,
    replacement: "[STREET_ADDRESS]",
  },
  {
    kind: "unit",
    pattern:
      /\b(?:APT|APARTMENT|UNIT|SUITE)[ \t]+(?:#\s*[A-Z0-9-]{1,10}|[A-Z0-9-]{0,9}\d[A-Z0-9-]{0,9})\b/giu,
    replacement: "[UNIT]",
  },
  {
    kind: "license_plate",
    pattern:
      /\b(?:LICENSE\s+)?PLATE(?:\s+(?:NUMBER|NO\.?))?\s*[:#-]?\s*[A-Z0-9-]{3,10}\b/giu,
    replacement: "[LICENSE_PLATE]",
  },
  {
    kind: "gate_code",
    pattern:
      /\b(?:GATE|DOOR|ENTRY|ACCESS)\s+CODE\s*(?:IS|:|#)?\s*[A-Z0-9*-]{3,12}\b/giu,
    replacement: "[GATE_CODE]",
  },
  {
    kind: "account_reference",
    pattern:
      /\b(?:HOA|OWNER|RESIDENT|DUES)\s+ACCOUNT(?:\s+(?:NUMBER|NO\.?|ID))?\s*[:#-]?\s*[A-Z0-9-]{4,20}\b/giu,
    replacement: "[ACCOUNT_REFERENCE]",
  },
];

const TOKEN_BY_KIND: Record<SyntheticPiiKind, string> = {
  account_reference: "[ACCOUNT_REFERENCE]",
  email: "[EMAIL]",
  gate_code: "[GATE_CODE]",
  license_plate: "[LICENSE_PLATE]",
  person_name: "[PERSON]",
  phone: "[PHONE]",
  ssn: "[SSN]",
  street_address: "[STREET_ADDRESS]",
  unit: "[UNIT]",
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

function applyPattern(
  text: string,
  pattern: RegExp,
  replacement: string,
): { text: string; count: number } {
  let count = 0;
  const nextText = text.replace(pattern, () => {
    count += 1;
    return replacement;
  });

  return { text: nextText, count };
}

export function findResidualPii(text: string): SyntheticPiiKind[] {
  return PII_RULES.flatMap((rule) => {
    rule.pattern.lastIndex = 0;
    return rule.pattern.test(text) ? [rule.kind] : [];
  });
}

export function assertSafeForClassification(text: string): void {
  const residualKinds = findResidualPii(text);

  if (residualKinds.length > 0) {
    throw new Error(
      `Redaction gate blocked classifier boundary: ${residualKinds.join(", ")}`,
    );
  }
}

export function redactTicket(ticket: NormalizedHoaTicket): RedactedHoaTicket {
  let subject = ticket.subject;
  let body = ticket.body;
  let redactionCount = 0;
  const redactionKinds = new Set<SyntheticPiiKind>();

  const knownIdentifiers = [...ticket.knownIdentifiers].sort(
    (left, right) => right.value.length - left.value.length,
  );

  for (const identifier of knownIdentifiers) {
    const pattern = new RegExp(escapeRegExp(identifier.value), "giu");
    const subjectResult = applyPattern(
      subject,
      pattern,
      TOKEN_BY_KIND[identifier.kind],
    );
    const bodyResult = applyPattern(
      body,
      pattern,
      TOKEN_BY_KIND[identifier.kind],
    );
    subject = subjectResult.text;
    body = bodyResult.text;

    if (subjectResult.count + bodyResult.count > 0) {
      redactionKinds.add(identifier.kind);
      redactionCount += subjectResult.count + bodyResult.count;
    }
  }

  for (const rule of PII_RULES) {
    const subjectResult = applyPattern(subject, rule.pattern, rule.replacement);
    const bodyResult = applyPattern(body, rule.pattern, rule.replacement);
    subject = subjectResult.text;
    body = bodyResult.text;

    if (subjectResult.count + bodyResult.count > 0) {
      redactionKinds.add(rule.kind);
      redactionCount += subjectResult.count + bodyResult.count;
    }
  }

  assertSafeForClassification(`${subject}\n${body}`);

  return {
    id: ticket.id,
    channel: ticket.channel,
    submittedAt: ticket.submittedAt,
    subject,
    body,
    redactionCount,
    redactionKinds: [...redactionKinds].sort(),
  };
}
