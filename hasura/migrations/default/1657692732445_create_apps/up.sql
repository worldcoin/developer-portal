CREATE TABLE "public"."app" ("id" varchar NOT NULL DEFAULT gen_random_friendly_id('app'), "team_id" varchar NOT NULL, "name" varchar NOT NULL DEFAULT '', "logo_url" text NOT NULL DEFAULT '', "verified_at" timestamptz null, PRIMARY KEY ("id") , FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON UPDATE restrict ON DELETE cascade, UNIQUE ("id"));
alter table "public"."action" add column "app_id" varchar null;
alter table "public"."action" add constraint "action_app_id_fkey" foreign key ("app_id") references "public"."app" ("id") on update restrict on delete cascade;

-- Create default app for team
INSERT INTO "public"."app"("team_id", "name", "logo_url", "verified_at") SELECT "id", COALESCE(NULLIF("app_name", ''), 'Default App'), "app_logo_url", "verified_at" FROM "public"."team";

-- Update all actions to have app_id set
UPDATE "public"."action" SET "app_id" = (SELECT "id" FROM "public"."app" WHERE "team_id" = "public"."action"."team_id");

-- `app_id` cannot be null
ALTER TABLE "public"."action" ALTER COLUMN "app_id" SET NOT NULL;

-- Remove `team_id` column from action table
alter table "public"."action" drop constraint "action_team_id_fkey";
alter table "public"."action" drop column "team_id";

-- Remove deprecated attributes from team table
alter table "public"."team" drop column "app_name";
alter table "public"."team" drop column "app_logo_url";
alter table "public"."team" drop column "verified_at";

-- Computed fields

-- Drop deprecated functions
drop function get_team_is_verified(team);
drop function get_verified_app_logo(team);

-- FUNCTION: get_app_is_verified
CREATE OR REPLACE FUNCTION get_app_is_verified(app_row app) 

RETURNS boolean

AS

$$

SELECT CASE WHEN (app_row.verified_at is not null) THEN true ELSE false END

$$

LANGUAGE sql STABLE;


-- FUNCTION: get_verified_app_logo
CREATE OR REPLACE FUNCTION get_verified_app_logo(app_row app) 

RETURNS VARCHAR

AS

$$

SELECT CASE WHEN (app_row.verified_at is not null) THEN app_row.logo_url ELSE '' END

$$

LANGUAGE sql STABLE;


-- FUNCTION: create_default_app_for_team
CREATE OR REPLACE FUNCTION create_default_app_for_team()
RETURNS trigger
    AS $$
    BEGIN
    INSERT INTO app (team_id, name) VALUES (NEW.id, COALESCE(NULLIF(NEW.name, ''), 'Default App'));
    RETURN null;
    END;
    $$
LANGUAGE 'plpgsql';

CREATE TRIGGER trigger_insert_team_create_default_app
after insert
on "public"."team"
for each row
execute procedure create_default_app_for_team();