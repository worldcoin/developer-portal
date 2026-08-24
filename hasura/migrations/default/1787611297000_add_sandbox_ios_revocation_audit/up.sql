ALTER TABLE "public"."sandbox_access_request_ios"
ADD COLUMN "revoked_at" timestamptz,
ADD COLUMN "revoked_by" varchar;

ALTER TABLE "public"."sandbox_access_request_ios"
ADD CONSTRAINT "sandbox_access_request_ios_revocation_audit"
CHECK (
    (
        "status" = 'revoked'
        AND "revoked_at" IS NOT NULL
        AND "revoked_by" IS NOT NULL
    )
    OR (
        "status" <> 'revoked'
        AND "revoked_at" IS NULL
        AND "revoked_by" IS NULL
    )
);
