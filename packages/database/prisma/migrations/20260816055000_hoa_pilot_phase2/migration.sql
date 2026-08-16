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

CREATE TABLE "hoa_memberships" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "accessTokenHash" TEXT NOT NULL,
    "humanActorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "hoa_memberships_pkey" PRIMARY KEY ("id")
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
CREATE UNIQUE INDEX "hoa_memberships_accessTokenHash_key" ON "hoa_memberships"("accessTokenHash");
CREATE UNIQUE INDEX "hoa_memberships_tenantId_humanActorId_key" ON "hoa_memberships"("tenantId", "humanActorId");
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

ALTER TABLE "hoa_memberships"
    ADD CONSTRAINT "hoa_memberships_tenantId_fkey"
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

CREATE FUNCTION "lookup_hoa_membership"("tokenHash" TEXT)
RETURNS TABLE ("tenantId" TEXT, "humanActorId" TEXT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
    SELECT membership."tenantId", membership."humanActorId"
    FROM public."hoa_memberships" AS membership
    WHERE membership."accessTokenHash" = "tokenHash"
    LIMIT 1
$$;

REVOKE ALL ON FUNCTION "lookup_hoa_membership"(TEXT) FROM PUBLIC;

-- @fail-closed(hoa-decision-direct-insert-denied)
REVOKE INSERT ON "hoa_decision_events" FROM PUBLIC;

CREATE FUNCTION "record_hoa_human_decision"(
    "eventId" TEXT,
    "tokenHash" TEXT,
    "targetSuggestionId" TEXT,
    "targetDecision" "HoaDecision",
    "targetRationale" TEXT
)
RETURNS TABLE ("tenantId" TEXT, "humanActorId" TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    membership_tenant_id TEXT;
    membership_human_actor_id TEXT;
BEGIN
    SELECT membership."tenantId", membership."humanActorId"
    INTO membership_tenant_id, membership_human_actor_id
    FROM public."hoa_memberships" AS membership
    WHERE membership."accessTokenHash" = "tokenHash"
    LIMIT 1;

    IF membership_tenant_id IS NULL OR membership_human_actor_id IS NULL THEN
        RAISE EXCEPTION 'verified human membership is required'
            USING ERRCODE = '42501';
    END IF;

    PERFORM set_config('app.tenant_id', membership_tenant_id, true);

    IF NOT EXISTS (
        SELECT 1
        FROM public."hoa_classifier_suggestions" AS suggestion
        WHERE suggestion."id" = "targetSuggestionId"
          AND suggestion."tenantId" = membership_tenant_id
    ) THEN
        RAISE EXCEPTION 'suggestion was not found in verified tenant'
            USING ERRCODE = 'P0002';
    END IF;

    -- Serialize decision appends with any action consuming current approval.
    PERFORM pg_advisory_xact_lock(
        hashtextextended(
            membership_tenant_id || ':' || "targetSuggestionId",
            0
        )
    );

    INSERT INTO public."hoa_decision_events" (
        "id",
        "tenantId",
        "suggestionId",
        "decision",
        "decisionSource",
        "humanActorId",
        "rationale"
    ) VALUES (
        "eventId",
        membership_tenant_id,
        "targetSuggestionId",
        "targetDecision",
        'HUMAN',
        membership_human_actor_id,
        "targetRationale"
    );

    RETURN QUERY SELECT membership_tenant_id, membership_human_actor_id;
END;
$$;

REVOKE ALL ON FUNCTION "record_hoa_human_decision"(TEXT, TEXT, TEXT, "HoaDecision", TEXT) FROM PUBLIC;

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
