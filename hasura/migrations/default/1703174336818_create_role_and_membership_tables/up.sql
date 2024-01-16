CREATE TABLE role (
  value text PRIMARY KEY,
  comment text
);

INSERT INTO role (value, comment) VALUES
  ('OWNER', 'Owner of the team'),
  ('ADMIN', 'Users with the privilege to manage other users'),
  ('MEMBER', 'Member user');

CREATE TABLE "public"."membership" (
  "id" varchar(50) NOT NULL DEFAULT gen_random_friendly_id ('memb'),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "user_id" varchar(50) NOT NULL,
  "role" text NOT NULL,
  "team_id" varchar(50) NOT NULL,
  PRIMARY KEY ("id"),
  FOREIGN KEY ("user_id") REFERENCES "public"."user" ("id") ON UPDATE RESTRICT ON DELETE CASCADE,
  FOREIGN KEY ("role") REFERENCES "public"."role" ("value") ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY ("team_id") REFERENCES "public"."team" ("id") ON UPDATE RESTRICT ON DELETE CASCADE
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

CREATE TRIGGER "set_public_memberships_updated_at"
BEFORE UPDATE ON "public"."membership"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_memberships_updated_at" ON "public"."membership" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
