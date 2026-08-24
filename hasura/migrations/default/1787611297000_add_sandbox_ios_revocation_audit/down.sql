DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM "public"."sandbox_access_request_ios"
        WHERE "status" = 'revoked'
    ) THEN
        RAISE EXCEPTION
            'Cannot remove sandbox iOS revocation audit while revoked rows exist';
    END IF;
END
$$;

ALTER TABLE "public"."sandbox_access_request_ios"
DROP CONSTRAINT "sandbox_access_request_ios_revocation_audit";

ALTER TABLE "public"."sandbox_access_request_ios"
DROP COLUMN "revoked_by",
DROP COLUMN "revoked_at";
