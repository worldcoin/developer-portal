ALTER TABLE "public"."sandbox_access_request_ios"
ADD COLUMN "approved_at" timestamptz,
ADD COLUMN "approved_by" varchar,
ADD COLUMN "rejection_reason" varchar(500);

UPDATE "public"."sandbox_access_request_ios"
SET
    "approved_at" = COALESCE("revoked_at", "updated_at"),
    "approved_by" = COALESCE("revoked_by", 'legacy:unknown')
WHERE "status" IN ('approved', 'revoking', 'revoked');

ALTER TABLE "public"."sandbox_access_request_ios"
ADD CONSTRAINT "sandbox_access_request_ios_approval_audit"
CHECK (
    (
        "status" IN ('approved', 'revoking', 'revoked')
        AND "approved_at" IS NOT NULL
        AND "approved_by" IS NOT NULL
    )
    OR (
        "status" IN ('pending', 'rejected')
        AND "approved_at" IS NULL
        AND "approved_by" IS NULL
    )
),
ADD CONSTRAINT "sandbox_access_request_ios_rejection_reason"
CHECK ("status" = 'rejected' OR "rejection_reason" IS NULL);
