-- Tenant-scoped, redacted-only persistence for the HOA pilot approval queue.
-- Raw intake fields intentionally have no columns in these tables.

CREATE TYPE "HoaDecision" AS ENUM ('APPROVED', 'REJECTED', 'NEEDS_CHANGES');
-- @fail-closed(hoa-human-decision-source)
CREATE TYPE "HoaDecisionSource" AS ENUM ('HUMAN');

CREATE TABLE "hoa_tenants" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "hoa_tenants_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "hoa_cases" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sourceTicketId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL,
    "redactedSubject" TEXT NOT NULL,
    "redactedBody" TEXT NOT NULL,
    "redactionCount" INTEGER NOT NULL,
    "redactionKinds" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "hoa_cases_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "hoa_classifier_suggestions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "urgency" TEXT NOT NULL,
    "suggestedOwner" TEXT NOT NULL,
    "reasonCodes" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "hoa_classifier_suggestions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "hoa_decision_events" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "suggestionId" TEXT NOT NULL,
    "decision" "HoaDecision" NOT NULL,
    "decisionSource" "HoaDecisionSource" NOT NULL DEFAULT 'HUMAN',
    "humanActorId" TEXT NOT NULL,
    "rationale" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "hoa_decision_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "hoa_tenants_slug_key" ON "hoa_tenants"("slug");
CREATE UNIQUE INDEX "hoa_cases_tenantId_sourceTicketId_key" ON "hoa_cases"("tenantId", "sourceTicketId");
CREATE UNIQUE INDEX "hoa_cases_tenantId_id_key" ON "hoa_cases"("tenantId", "id");
CREATE INDEX "hoa_cases_tenantId_submittedAt_idx" ON "hoa_cases"("tenantId", "submittedAt");
CREATE UNIQUE INDEX "hoa_classifier_suggestions_tenantId_caseId_key" ON "hoa_classifier_suggestions"("tenantId", "caseId");
CREATE UNIQUE INDEX "hoa_classifier_suggestions_tenantId_id_key" ON "hoa_classifier_suggestions"("tenantId", "id");
CREATE INDEX "hoa_classifier_suggestions_tenantId_createdAt_idx" ON "hoa_classifier_suggestions"("tenantId", "createdAt");
CREATE INDEX "hoa_decision_events_tenantId_suggestionId_createdAt_idx" ON "hoa_decision_events"("tenantId", "suggestionId", "createdAt");

ALTER TABLE "hoa_cases"
    ADD CONSTRAINT "hoa_cases_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "hoa_tenants"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "hoa_classifier_suggestions"
    ADD CONSTRAINT "hoa_classifier_suggestions_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "hoa_tenants"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "hoa_classifier_suggestions"
    -- @fail-closed(hoa-case-suggestion-tenant-link)
    ADD CONSTRAINT "hoa_classifier_suggestions_tenantId_caseId_fkey"
    FOREIGN KEY ("tenantId", "caseId") REFERENCES "hoa_cases"("tenantId", "id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "hoa_decision_events"
    ADD CONSTRAINT "hoa_decision_events_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "hoa_tenants"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "hoa_decision_events"
    -- @fail-closed(hoa-suggestion-decision-tenant-link)
    ADD CONSTRAINT "hoa_decision_events_tenantId_suggestionId_fkey"
    FOREIGN KEY ("tenantId", "suggestionId") REFERENCES "hoa_classifier_suggestions"("tenantId", "id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- @fail-closed(hoa-tenant-case-rls)
ALTER TABLE "hoa_cases" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "hoa_cases" FORCE ROW LEVEL SECURITY;
CREATE POLICY "hoa_cases_tenant_isolation" ON "hoa_cases"
    USING ("tenantId" = NULLIF(current_setting('app.tenant_id', true), ''))
    WITH CHECK ("tenantId" = NULLIF(current_setting('app.tenant_id', true), ''));

-- @fail-closed(hoa-tenant-suggestion-rls)
ALTER TABLE "hoa_classifier_suggestions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "hoa_classifier_suggestions" FORCE ROW LEVEL SECURITY;
CREATE POLICY "hoa_classifier_suggestions_tenant_isolation" ON "hoa_classifier_suggestions"
    USING ("tenantId" = NULLIF(current_setting('app.tenant_id', true), ''))
    WITH CHECK ("tenantId" = NULLIF(current_setting('app.tenant_id', true), ''));

-- @fail-closed(hoa-tenant-decision-rls)
ALTER TABLE "hoa_decision_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "hoa_decision_events" FORCE ROW LEVEL SECURITY;
CREATE POLICY "hoa_decision_events_tenant_isolation" ON "hoa_decision_events"
    USING ("tenantId" = NULLIF(current_setting('app.tenant_id', true), ''))
    WITH CHECK ("tenantId" = NULLIF(current_setting('app.tenant_id', true), ''));

-- @fail-closed(hoa-decision-events-append-only)
CREATE FUNCTION "reject_hoa_decision_event_mutation"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'hoa_decision_events is append-only'
        USING ERRCODE = '55000';
END;
$$;

CREATE TRIGGER "hoa_decision_events_reject_update_delete"
    BEFORE UPDATE OR DELETE ON "hoa_decision_events"
    FOR EACH ROW
    EXECUTE FUNCTION "reject_hoa_decision_event_mutation"();

CREATE TRIGGER "hoa_decision_events_reject_truncate"
    BEFORE TRUNCATE ON "hoa_decision_events"
    FOR EACH STATEMENT
    EXECUTE FUNCTION "reject_hoa_decision_event_mutation"();
