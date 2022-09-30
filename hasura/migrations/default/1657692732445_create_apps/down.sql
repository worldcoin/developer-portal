alter table "public"."team" add column "app_name" text not null default '';
alter table "public"."team" add column "verified_at" timestamptz null;
alter table "public"."team" add column "app_logo_url" text not null default '';
-- Note: We don't fill these attributes again (on "public"."team") in the down migration.

alter table "public"."action" add column "team_id" varchar(50) NULL;
UPDATE "public"."action" SET "team_id" = (SELECT "team_id" FROM "public"."app" WHERE "id" = "public"."action"."app_id");
alter table "public"."action" add constraint "action_team_id_fkey" foreign key ("team_id") references "public"."team" ("id") on update restrict on delete cascade;

alter table "public"."action" drop constraint "action_app_id_fkey";
ALTER TABLE "public"."action" drop column "app_id";
DROP TABLE "public"."app";

drop function get_app_is_verified(app);
drop function get_verified_app_logo(app);

-- FUNCTION: get_team_is_verified
CREATE OR REPLACE FUNCTION get_team_is_verified(team_row team) 

RETURNS boolean

AS

$$

SELECT CASE WHEN (team_row.verified_at is not null) THEN true ELSE false END

$$

LANGUAGE sql STABLE;


-- FUNCTION: get_verified_app_logo
CREATE OR REPLACE FUNCTION get_verified_app_logo(team_row team) 

RETURNS VARCHAR

AS

$$

SELECT CASE WHEN (team_row.verified_at is not null) THEN team_row.app_logo_url ELSE '' END

$$

LANGUAGE sql STABLE;
