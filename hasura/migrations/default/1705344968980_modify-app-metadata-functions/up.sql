ALTER TABLE "public"."app_metadata"
ADD COLUMN is_row_verified boolean NOT NULL;

CREATE OR REPLACE FUNCTION validate_single_url(url text)
RETURNS void as $$
BEGIN
  IF url IS NOT NULL AND url != '' THEN
--   Hash parameters are allowed for these URLs
    IF NOT (url ~* '^https://([[:alnum:]_-]+\.)+[[:alnum:]_-]+(/[[:alnum:]_\-./?%&#=]*)?$') THEN
      RAISE EXCEPTION USING ERRCODE= '22000', MESSAGE= 'Invalid URL format. URLs must use HTTPS protocol.';
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "trigger_enforce_app_id_row_limit" ON "public"."app_metadata";

DROP FUNCTION IF EXISTS "enforce_app_id_row_limit";

CREATE FUNCTION set_is_row_verified()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'verified' THEN
    NEW.is_row_verified := false;
  ELSE
    NEW.is_row_verified := true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_is_row_verified
BEFORE INSERT OR UPDATE ON "public"."app_metadata"
FOR EACH ROW
EXECUTE FUNCTION set_is_row_verified();

DROP FUNCTION IF EXISTS get_app_is_verified (app);

DROP FUNCTION IF EXISTS get_verified_app_logo (app);

alter table "public"."app_metadata" add constraint "app_metadata_id_is_row_verified_key" unique ("app_id", "is_row_verified");
