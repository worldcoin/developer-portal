-- A table-wide UNIQUE(asc_email) let any authenticated portal user permanently
-- claim a third party's Apple Account: once the row existed no admin or
-- self-service transition released the address, because rejected and revoked
-- rows kept occupying the constraint.
--
-- Scope uniqueness to the rows that still hold a live claim on the address.
-- Two approved (or in-flight) enrollments still cannot share one Apple
-- Account, but rejecting or revoking a request now releases it for its owner.
ALTER TABLE "public"."sandbox_access_request_ios"
    DROP CONSTRAINT IF EXISTS "unique_sandbox_access_request_ios_asc_email";

CREATE UNIQUE INDEX IF NOT EXISTS "sandbox_access_request_ios_live_asc_email_key"
    ON "public"."sandbox_access_request_ios" ("asc_email")
    WHERE "status" IN ('pending', 'approving', 'approved', 'revoking');
