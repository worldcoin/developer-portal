CREATE TABLE "public"."redirect" ("id" varchar(50) NOT NULL DEFAULT gen_random_friendly_id('redirect'), "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), "action_id" varchar(50) NOT NULL, "uri" jsonb NOT NULL DEFAULT jsonb_build_array(), PRIMARY KEY ("id") , UNIQUE ("id"), UNIQUE ("action_id"));
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
CREATE TRIGGER "set_public_redirect_updated_at"
BEFORE UPDATE ON "public"."redirect"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_redirect_updated_at" ON "public"."redirect" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
