CREATE TABLE "public"."credentials" ("id" varchar NOT NULL, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), "credential_type" varchar NOT NULL, "verification_session_id" varchar, "credential_hash" varchar, "status" varchar NOT NULL DEFAULT 'created', "identity_commitment" varchar NOT NULL, "error_details" varchar NOT NULL, "credential_data" json, PRIMARY KEY ("id") , UNIQUE ("id"), UNIQUE ("verification_session_id"), UNIQUE ("identity_commitment"), UNIQUE ("credential_hash"), CONSTRAINT "status_choices" CHECK (status = ANY (ARRAY['created'::text, 'verified'::text, 'errored'::text])), CONSTRAINT "credential_type_choices" CHECK (credential_type = ANY (ARRAY['phone'::text, 'identity'::text, 'orb'::text])));
CREATE OR REPLACE FUNCTION "public"."set_current_timestamp_updated_at"()
RETURNS TRIGGER AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "set_public_credentials_updated_at"
BEFORE UPDATE ON "public"."credentials"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_credentials_updated_at" ON "public"."credentials" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
