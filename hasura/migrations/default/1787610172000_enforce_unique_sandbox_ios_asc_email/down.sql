ALTER TABLE "public"."sandbox_access_request_ios"
DROP CONSTRAINT "sandbox_access_request_ios_asc_email_is_canonical";

ALTER TABLE "public"."sandbox_access_request_ios"
DROP CONSTRAINT "unique_sandbox_access_request_ios_asc_email";
