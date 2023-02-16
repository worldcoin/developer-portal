CREATE TABLE "public"."credential" ("id" varchar(50) NOT NULL DEFAULT gen_random_friendly_id('cred'), "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), "credential_type" character varying NOT NULL, "verification_session_id" varchar, "credential_hash" character varying, "status" character varying NOT NULL, "identity_commitment" character varying NOT NULL, "error_details" character varying NOT NULL, "credential_data" json NOT NULL, PRIMARY KEY ("id") , UNIQUE ("id"), UNIQUE ("identity_commitment"), UNIQUE ("credential_hash"), UNIQUE ("verification_session_id"), CONSTRAINT "status_choices" CHECK (status = ANY (ARRAY ['created'::text, 'verified'::text, 'errored'::text])), CONSTRAINT "credential_type_choices" CHECK (credential_type = ANY (ARRAY ['phone'::text, 'identity'::text, 'orb'::text])));
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
CREATE TRIGGER "set_public_credential_updated_at"
BEFORE UPDATE ON "public"."credential"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_credential_updated_at" ON "public"."credential" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
