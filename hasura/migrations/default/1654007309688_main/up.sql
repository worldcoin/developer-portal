CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE "public"."cache" ("id" varchar(50) NOT NULL DEFAULT gen_random_friendly_id('cc'), "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), "key" text NOT NULL, "value" text, PRIMARY KEY ("id") , UNIQUE ("key"));

CREATE TABLE "public"."team" ("id" varchar(50) NOT NULL DEFAULT gen_random_friendly_id('team'), "name" varchar, "created_at" timestamptz NOT NULL default now(), "updated_at" timestamptz NOT NULL default now(), "app_name" text not null default '', "app_logo_url" text not null default '', "verified_at" timestamptz null, PRIMARY KEY ("id") , UNIQUE ("name"));COMMENT ON TABLE "public"."team" IS E'A team of users';

CREATE TABLE "public"."user" ("id" varchar(50) NOT NULL DEFAULT gen_random_friendly_id('usr'), "name" varchar, "email" varchar NOT NULL, "team_id" varchar(50) NOT NULL, "password" varchar NOT NULL, "created_at" timestamptz NOT NULL default now(), "updated_at" timestamptz NOT NULL default now(), PRIMARY KEY ("id"), FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON UPDATE restrict ON DELETE CASCADE, UNIQUE ("name"), UNIQUE ("email"));

-- ID of `action` gets generated as a trigger to set a different prefix for `staging`
CREATE TABLE "public"."action" ("id" varchar(50) NOT NULL, "team_id" varchar(50) NOT NULL, "name" text NOT NULL, "is_staging" boolean not null default 'true', "public_description" Text NOT NULL, "description" text NOT NULL, "engine" TEXT NOT NULL DEFAULT 'cloud', "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), "status" text NOT NULL DEFAULT 'created', "crypto_chain" text not null, "return_url" text NOT NULL, PRIMARY KEY ("id"), FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON UPDATE restrict ON DELETE cascade, UNIQUE ("id"));

CREATE TABLE "public"."nullifier" ("id" varchar(50) NOT NULL DEFAULT gen_random_friendly_id('nil'), "action_id" varchar(50) NOT NULL, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), "nullifier_hash" Text NOT NULL, "merkle_root" text NOT NULL, PRIMARY KEY ("id") , FOREIGN KEY ("action_id") REFERENCES "public"."action"("id") ON UPDATE restrict ON DELETE cascade, UNIQUE ("id"));

CREATE TABLE "public"."jwks" ("id" varchar(50) NOT NULL DEFAULT gen_random_friendly_id('jwk'), "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), "expires_at" timestamptz NOT NULL, "private_jwk" jsonb NOT NULL, "public_jwk" JSONB NOT NULL,  PRIMARY KEY ("id"));COMMENT ON TABLE "public"."jwks" IS E'Stores valid JWKs used for offline signature verification';


---------- BEGIN CONSTRAINTS ---------

alter table "public"."action" add constraint "engine_choices" check (engine IN ('cloud', 'blockchain'));

alter table "public"."action" add constraint "status_choices" check (status IN ('created', 'active', 'inactive'));


---------- BEGIN COMMENTS ON TABLES ---------

COMMENT ON COLUMN "public"."team"."app_name" is E'Public app name';
COMMENT ON COLUMN "public"."team"."app_logo_url" is E'Public app logo (URL)';


---------- BEGIN UPDATED_AT FUNCTIONS ---------

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
CREATE TRIGGER "set_public_team_updated_at"
BEFORE UPDATE ON "public"."team"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_team_updated_at" ON "public"."team" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';


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
CREATE TRIGGER "set_public_action_updated_at"
BEFORE UPDATE ON "public"."action"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_action_updated_at" ON "public"."action" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';


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
CREATE TRIGGER "set_public_nullifier_updated_at"
BEFORE UPDATE ON "public"."nullifier"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_nullifier_updated_at" ON "public"."nullifier" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';


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
CREATE EXTENSION IF NOT EXISTS pgcrypto;


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
CREATE EXTENSION IF NOT EXISTS pgcrypto;
