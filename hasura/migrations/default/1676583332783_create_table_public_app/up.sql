CREATE TABLE "public"."app" (
  "id" varchar(50) NOT NULL DEFAULT gen_random_friendly_id('app'),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "team_id" character varying NOT NULL,
  "name" character varying NOT NULL,
  "logo_url" text NOT NULL,
  "verified_at" timestamptz,
  "description" text NOT NULL,
  "is_staging" boolean NOT NULL DEFAULT true,
  "engine" text NOT NULL DEFAULT 'cloud',
  "status" text NOT NULL DEFAULT 'active',
  "user_interfaces" jsonb NOT NULL,
  "is_archived" Boolean NOT NULL DEFAULT false,
  PRIMARY KEY ("id"),
  FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON UPDATE restrict ON DELETE cascade, 
  UNIQUE ("id")
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
CREATE TRIGGER "set_public_app_updated_at"
BEFORE UPDATE ON "public"."app"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_app_updated_at" ON "public"."app" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
