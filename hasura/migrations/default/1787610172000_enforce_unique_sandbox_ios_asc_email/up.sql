-- App Store Connect tester identity is case-insensitive. Canonicalize any
-- pre-existing requests before enforcing single ownership of an ASC email.
UPDATE "public"."sandbox_access_request_ios"
SET "asc_email" = lower(btrim("asc_email"))
WHERE "asc_email" <> lower(btrim("asc_email"));

-- Intentionally fail the migration if true duplicates already exist. They
-- must be reconciled explicitly so an approved request is not silently lost.
ALTER TABLE "public"."sandbox_access_request_ios"
ADD CONSTRAINT "unique_sandbox_access_request_ios_asc_email" UNIQUE ("asc_email");

ALTER TABLE "public"."sandbox_access_request_ios"
ADD CONSTRAINT "sandbox_access_request_ios_asc_email_is_canonical"
CHECK ("asc_email" = lower(btrim("asc_email")));
