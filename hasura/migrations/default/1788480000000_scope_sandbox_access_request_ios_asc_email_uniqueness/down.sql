DROP INDEX IF EXISTS "public"."sandbox_access_request_ios_live_asc_email_key";

-- Fails loudly (unique_violation, rolling the whole migration back) if a
-- released address was already re-claimed by its owner. That is intended:
-- silently dropping one of the two rows would delete a real enrollment.
ALTER TABLE "public"."sandbox_access_request_ios"
    ADD CONSTRAINT "unique_sandbox_access_request_ios_asc_email" UNIQUE ("asc_email");
