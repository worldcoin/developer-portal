CREATE OR REPLACE FUNCTION get_verified_app_logo(app_row app) RETURNS VARCHAR AS $$
SELECT CASE
    WHEN (app_row.verified_at is not null) THEN app_row.logo_url
    ELSE ''
  END $$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION get_app_is_verified(app_row app) RETURNS boolean AS $$
SELECT CASE
    WHEN (app_row.verified_at is not null) THEN true
    ELSE false
  END $$ LANGUAGE sql STABLE;

DROP TRIGGER IF EXISTS "trigger_set_upsert_constraint" ON "public"."app_metadata";

DROP FUNCTION IF EXISTS "set_upsert_constraint";

DROP FUNCTION IF EXISTS "enforce_app_id_row_limit";

alter table "public"."app_metadata"
drop column if exists "unique_verification_status_row";