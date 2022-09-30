CREATE TABLE "public"."api_key" ("id" varchar NOT NULL DEFAULT gen_random_friendly_id('key'), "team_id" varchar NOT NULL, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), "is_active" boolean NOT NULL DEFAULT true, PRIMARY KEY ("id") , FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON UPDATE restrict ON DELETE cascade);
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
CREATE TRIGGER "set_public_api_key_updated_at"
BEFORE UPDATE ON "public"."api_key"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_api_key_updated_at" ON "public"."api_key" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
