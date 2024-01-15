ALTER TABLE "public"."app_metadata"
ADD COLUMN unique_verification_status_row varchar NOT NULL UNIQUE;

CREATE OR REPLACE FUNCTION validate_single_url(url text)
RETURNS void as $$
BEGIN
  IF url IS NOT NULL AND url != '' THEN
--   Allow hash params now
    IF NOT (url ~* '^https://([[:alnum:]_-]+\.)+[[:alnum:]_-]+(/[[:alnum:]_\-./?%&#=]*)?$') THEN
      RAISE EXCEPTION USING ERRCODE= '22000', MESSAGE= 'Invalid URL format. URLs must use HTTPS protocol.';
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION "enforce_app_id_row_limit"()
RETURNS TRIGGER AS $$
DECLARE
  app_id_count integer;
BEGIN
  SELECT COUNT(*)
  INTO app_id_count
  FROM "public"."app_metadata"
  WHERE "app_id" = NEW."app_id";

  IF app_id_count > 2 THEN
    RAISE EXCEPTION 'Each app_id can have at most two rows in the table.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "trigger_enforce_app_id_row_limit" ON "public"."app_metadata";
-- Change trigger to after
CREATE TRIGGER "trigger_enforce_app_id_row_limit"
AFTER INSERT OR UPDATE ON "public"."app_metadata"
FOR EACH ROW
EXECUTE FUNCTION enforce_app_id_row_limit();

CREATE FUNCTION set_unique_verification_status_row()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'verified' THEN
    NEW.unique_verification_status_row := NEW.app_id || '_verified';
  ELSE
    NEW.unique_verification_status_row := NEW.app_id || '_unverified';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_unique_verification_status_row
BEFORE INSERT OR UPDATE ON "public"."app_metadata"
FOR EACH ROW
EXECUTE FUNCTION set_unique_verification_status_row();

DROP FUNCTION IF EXISTS get_app_is_verified (app);

DROP FUNCTION IF EXISTS get_verified_app_logo (app);