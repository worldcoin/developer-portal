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

DROP TRIGGER IF EXISTS "trigger_set_is_row_verified" ON "public"."app_metadata";

DROP FUNCTION IF EXISTS "set_is_row_verified";

CREATE OR REPLACE FUNCTION validate_single_url(url text)
RETURNS void as $$
BEGIN
  IF url IS NOT NULL AND url != '' THEN
    IF NOT (url ~* '^https://([[:alnum:]_-]+\.)+[[:alnum:]_-]+(/[[:alnum:]_\-./?%&=]*)?$') THEN
      RAISE EXCEPTION USING ERRCODE= '22000', MESSAGE= 'Invalid URL format. URLs must use HTTPS protocol.';
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP INDEX "public"."unique_verified_app_id";

ALTER TABLE "public"."app_metadata"
RENAME COLUMN "verification_status" TO "status";

CREATE UNIQUE INDEX "unique_verified_app_id" ON "public"."app_metadata" (app_id)
WHERE status = 'verified';

alter table "public"."app_metadata"
drop column if exists "is_row_verified";

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
BEFORE INSERT ON "public"."app_metadata"
FOR EACH ROW
EXECUTE FUNCTION enforce_app_id_row_limit();



