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

DROP TRIGGER IF EXISTS "trigger_set_unique_verification_status_row" ON "public"."app_metadata";

DROP FUNCTION IF EXISTS "set_unique_verification_status_row";

CREATE OR REPLACE FUNCTION "enforce_app_id_row_limit"()
RETURNS TRIGGER AS $$
DECLARE
  app_id_count integer;
BEGIN
  SELECT COUNT(*)
  INTO app_id_count
  FROM "public"."app_metadata"
  WHERE "app_id" = NEW."app_id";

  IF app_id_count >= 2 THEN
    RAISE EXCEPTION 'Each app_id can have at most two rows in the table.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "trigger_enforce_app_id_row_limit"
BEFORE INSERT OR UPDATE ON "public"."app_metadata"
FOR EACH ROW
EXECUTE FUNCTION enforce_app_id_row_limit();

DROP FUNCTION IF EXISTS "validate_single_url";

alter table "public"."app_metadata"
drop column if exists "unique_verification_status_row";

