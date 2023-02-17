CREATE TABLE "public"."jwks" (
  "id" varchar(50) NOT NULL DEFAULT gen_random_friendly_id('jwk'),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "expires_at" timestamptz NOT NULL,
  "private_jwk" jsonb NOT NULL,
  "public_jwk" jsonb NOT NULL,
  PRIMARY KEY ("id")
);
COMMENT ON TABLE "public"."jwks" IS E'Stores valid JWKs used for offline signature verification';

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
CREATE TRIGGER "set_public_jwks_updated_at"
BEFORE UPDATE ON "public"."jwks"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_jwks_updated_at" ON "public"."jwks" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
