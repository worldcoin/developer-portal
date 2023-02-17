CREATE TABLE "public"."nullifier" (
  "id" varchar(50) NOT NULL DEFAULT gen_random_friendly_id ('nil'),
  "action_id" varchar(50) NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "nullifier_hash" text NOT NULL,
  "merkle_root" text NOT NULL,
  "verification_level" varchar NOT NULL DEFAULT 'orb',
  PRIMARY KEY ("id"),
  FOREIGN KEY ("action_id") REFERENCES "public"."action" ("id") ON UPDATE RESTRICT ON DELETE CASCADE,
  UNIQUE ("id"),
  CONSTRAINT "verification_level_choices" CHECK (verification_level = ANY (ARRAY['orb'::text, 'phone'::text]))
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

CREATE TRIGGER "set_public_nullifier_updated_at"
  BEFORE UPDATE ON "public"."nullifier"
  FOR EACH ROW
  EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at" ();

COMMENT ON TRIGGER "set_public_nullifier_updated_at" ON "public"."nullifier" IS 'trigger to set value of column "updated_at" to current timestamp on row update';

