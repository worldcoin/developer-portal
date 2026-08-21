CREATE TYPE "public"."sandbox_access_request_ios_status" AS ENUM (
    'pending',
    'approved',
    'rejected'
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
        PRIMARY KEY ("id"),
        FOREIGN KEY ("user_id") REFERENCES "public"."user" ("id") ON UPDATE restrict ON DELETE cascade,
        FOREIGN KEY ("team_id") REFERENCES "public"."team" ("id") ON UPDATE restrict ON DELETE cascade,
        CONSTRAINT "unique_sandbox_access_request_ios_user_id" UNIQUE ("user_id")
    );

CREATE TRIGGER "set_public_sandbox_access_request_ios_updated_at"
BEFORE UPDATE ON "public"."sandbox_access_request_ios"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at" ();

COMMENT ON TRIGGER "set_public_sandbox_access_request_ios_updated_at" ON "public"."sandbox_access_request_ios"
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
