DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM "public"."sandbox_access_request_ios"
        WHERE "status"::text = 'revoked'
    ) THEN
        RAISE EXCEPTION
            'Cannot remove sandbox iOS revoked status while revoked rows exist';
    END IF;
END
$$;

ALTER TABLE "public"."sandbox_access_request_ios"
ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "public"."sandbox_access_request_ios"
ALTER COLUMN "status" TYPE text USING "status"::text;

DROP TYPE "public"."sandbox_access_request_ios_status";

CREATE TYPE "public"."sandbox_access_request_ios_status" AS ENUM (
    'pending',
    'approved',
    'rejected'
);

ALTER TABLE "public"."sandbox_access_request_ios"
ALTER COLUMN "status" TYPE "public"."sandbox_access_request_ios_status"
USING "status"::"public"."sandbox_access_request_ios_status";

ALTER TABLE "public"."sandbox_access_request_ios"
ALTER COLUMN "status" SET DEFAULT 'pending';
