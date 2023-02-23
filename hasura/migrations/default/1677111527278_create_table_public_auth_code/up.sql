CREATE TABLE "public"."auth_code" ("id" varchar(50) NOT NULL DEFAULT gen_random_friendly_id('auth'), "app_id" varchar(50) NOT NULL, "auth_code" varchar(32) NOT NULL, "expires_at" timestamptz NOT NULL, "nullifier_hash" text NOT NULL, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), PRIMARY KEY ("id") , FOREIGN KEY ("app_id") REFERENCES "public"."app"("id") ON UPDATE cascade ON DELETE cascade, UNIQUE ("id"));
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
CREATE TRIGGER "set_public_auth_code_updated_at"
BEFORE UPDATE ON "public"."auth_code"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_auth_code_updated_at" ON "public"."auth_code" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
