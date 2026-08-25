CREATE TYPE "public"."sandbox_access_request_ios_status" AS ENUM (
    'pending',
    'approved',
    'rejected',
    'revoking',
    'revoked'
);

CREATE TABLE
    "public"."sandbox_access_request_ios" (
        "id" varchar NOT NULL DEFAULT gen_random_friendly_id ('sbx_req'),
        "user_id" varchar NOT NULL,
        "team_id" varchar NOT NULL,
        "portal_email" varchar NOT NULL,
        "asc_email" varchar NOT NULL,
        "status" "public"."sandbox_access_request_ios_status" NOT NULL DEFAULT 'pending',
        "created_at" timestamptz NOT NULL DEFAULT now (),
        "updated_at" timestamptz NOT NULL DEFAULT now (),
        "approved_at" timestamptz,
        "rejection_reason" varchar(500),
        "revoked_at" timestamptz,
        PRIMARY KEY ("id"),
        FOREIGN KEY ("user_id") REFERENCES "public"."user" ("id") ON UPDATE restrict ON DELETE cascade,
        FOREIGN KEY ("team_id") REFERENCES "public"."team" ("id") ON UPDATE restrict ON DELETE cascade,
        CONSTRAINT "unique_sandbox_access_request_ios_user_id" UNIQUE ("user_id"),
        CONSTRAINT "unique_sandbox_access_request_ios_asc_email" UNIQUE ("asc_email"),
        CONSTRAINT "sandbox_access_request_ios_asc_email_is_canonical"
            CHECK ("asc_email" = lower(btrim("asc_email"))),
        CONSTRAINT "sandbox_access_request_ios_approval_audit"
            CHECK (
                (
                    "status" IN ('approved', 'revoking', 'revoked')
                    AND "approved_at" IS NOT NULL
                )
                OR (
                    "status" IN ('pending', 'rejected')
                    AND "approved_at" IS NULL
                )
            ),
        CONSTRAINT "sandbox_access_request_ios_rejection_reason"
            CHECK ("status" = 'rejected' OR "rejection_reason" IS NULL),
        CONSTRAINT "sandbox_access_request_ios_revocation_audit"
            CHECK (
                (
                    "status" = 'revoked'
                    AND "revoked_at" IS NOT NULL
                )
                OR (
                    "status" <> 'revoked'
                    AND "revoked_at" IS NULL
                )
            )
    );

CREATE TRIGGER "set_public_sandbox_access_request_ios_updated_at"
BEFORE UPDATE ON "public"."sandbox_access_request_ios"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at" ();

COMMENT ON TRIGGER "set_public_sandbox_access_request_ios_updated_at" ON "public"."sandbox_access_request_ios"
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
