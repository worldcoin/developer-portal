CREATE TABLE "public"."action" (
  "id" varchar(50) NOT NULL DEFAULT gen_random_friendly_id ('action'),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "name" text NOT NULL,
  "description" text NOT NULL,
  "raw_action" text NOT NULL,
  "external_nullifier" text NOT NULL DEFAULT '',
  "redirect_url" text NOT NULL DEFAULT '',
  "app_id" varchar(50) NOT NULL,
  "max_accounts_per_user" integer NOT NULL DEFAULT 1,
  "max_verifications" integer NOT NULL DEFAULT 1,
  PRIMARY KEY ("id"),
  FOREIGN KEY ("app_id") REFERENCES "public"."app" ("id") ON UPDATE RESTRICT ON DELETE CASCADE,
  UNIQUE ("id")
);

CREATE OR REPLACE FUNCTION "public"."set_current_timestamp_updated_at" ()
  RETURNS TRIGGER
  AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$
LANGUAGE plpgsql;

CREATE TRIGGER "set_public_action_updated_at"
  BEFORE UPDATE ON "public"."action"
  FOR EACH ROW
  EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at" ();

COMMENT ON TRIGGER "set_public_action_updated_at" ON "public"."action" IS 'trigger to set value of column "updated_at" to current timestamp on row update';

