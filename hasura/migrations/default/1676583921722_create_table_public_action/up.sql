CREATE TABLE "public"."action" (
  "id" varchar(50) NOT NULL DEFAULT gen_random_friendly_id ('action'),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "name" text NOT NULL,
  "description" text NOT NULL,
  "action" text NOT NULL,
  "external_nullifier" text NOT NULL DEFAULT '',
  "app_id" varchar(50) NOT NULL,
  "max_accounts_per_user" integer NOT NULL DEFAULT 1,
  "max_verifications" integer NOT NULL DEFAULT 1,
  "creation_mode" varchar(50) NOT NULL DEFAULT 'developer_portal',
  PRIMARY KEY ("id"),
  FOREIGN KEY ("app_id") REFERENCES "public"."app" ("id") ON UPDATE RESTRICT ON DELETE CASCADE,
  CONSTRAINT "creation_mode_choices" CHECK (verification_level = ANY (ARRAY['developer_portal'::text, 'dynamic'::text]))
  UNIQUE ("id")
);

comment on column "public"."action"."name" is E'Friendly name given to an action in the Developer Portal.';
comment on column "public"."action"."action" is E'Raw action value as passed by the dev to IDKit.';
comment on column "public"."action"."external_nullifier" is E'Encoded and hashed value of app_id and action. Determines scope for uniqueness. Used for Semaphore ZKPs.';
comment on column "public"."action"."max_verifications" is E'Only used for actions. Only for actions verified in the Developer Portal. Determines the maximum number of verifications that a user can perform for this action.';
comment on column "public"."action"."max_accounts_per_user" is E'Only for Sign in with World ID. Determines the maximum number of accounts a single person can have for the respective app.';


-- unique constaints
alter table "public"."action" add constraint "action_app_id_external_nullifier_key" unique ("app_id", "external_nullifier");
alter table "public"."action" add constraint "action_app_id_action_key" unique ("app_id", "action");

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

