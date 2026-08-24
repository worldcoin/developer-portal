ALTER TABLE "public"."sandbox_access_request_ios"
DROP CONSTRAINT "sandbox_access_request_ios_rejection_reason",
DROP CONSTRAINT "sandbox_access_request_ios_approval_audit";

ALTER TABLE "public"."sandbox_access_request_ios"
DROP COLUMN "rejection_reason",
DROP COLUMN "approved_by",
DROP COLUMN "approved_at";
