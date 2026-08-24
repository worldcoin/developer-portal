DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM "public"."sandbox_access_request_ios"
        WHERE "status"::text = 'revoking'
    ) THEN
        RAISE EXCEPTION
            'Cannot remove sandbox iOS revoking status while revoking rows exist';
    END IF;
END
$$;

ALTER TABLE "public"."sandbox_access_request_ios"
DROP CONSTRAINT "sandbox_access_request_ios_revocation_audit";

ALTER TABLE "public"."sandbox_access_request_ios"
ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "public"."sandbox_access_request_ios"
ALTER COLUMN "status" TYPE text USING "status"::text;

DROP TYPE "public"."sandbox_access_request_ios_status";

CREATE TYPE "public"."sandbox_access_request_ios_status" AS ENUM (
    'pending',
    'approved',
    'rejected',
    'revoked'
);

ALTER TABLE "public"."sandbox_access_request_ios"
ALTER COLUMN "status" TYPE "public"."sandbox_access_request_ios_status"
USING "status"::"public"."sandbox_access_request_ios_status";

ALTER TABLE "public"."sandbox_access_request_ios"
ALTER COLUMN "status" SET DEFAULT 'pending';

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
