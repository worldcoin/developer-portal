CREATE TABLE "public"."user" (
  "id" varchar(50) NOT NULL DEFAULT gen_random_friendly_id ('usr'),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "email" varchar NOT NULL DEFAULT '',
  "team_id" varchar(50) NOT NULL,
  "world_id_nullifier" varchar NOT NULL,
  "is_subscribed" boolean NOT NULL DEFAULT FALSE,
  "ironclad_id" character varying NOT NULL,
  PRIMARY KEY ("id"),
  FOREIGN KEY ("team_id") REFERENCES "public"."team" ("id") ON UPDATE RESTRICT ON DELETE CASCADE,
  UNIQUE ("email")
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
CREATE TRIGGER "set_public_user_updated_at"
BEFORE UPDATE ON "public"."user"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_user_updated_at" ON "public"."user" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
