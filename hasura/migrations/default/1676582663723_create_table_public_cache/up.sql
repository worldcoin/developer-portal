CREATE TABLE "public"."cache" (
  "id" varchar(50) NOT NULL DEFAULT gen_random_friendly_id('cc'),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "key" text NOT NULL,
  "value" text,
  PRIMARY KEY ("id"),
  UNIQUE ("key")
);

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
CREATE TRIGGER "set_public_cache_updated_at"
BEFORE UPDATE ON "public"."cache"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_cache_updated_at" ON "public"."cache" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
