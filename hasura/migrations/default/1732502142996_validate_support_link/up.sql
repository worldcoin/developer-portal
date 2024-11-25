CREATE OR REPLACE FUNCTION validate_support_link()
RETURNS TRIGGER as $$
BEGIN
  IF NEW.support_link IS NOT NULL AND NEW.support_link != '' THEN
    IF NOT (NEW.support_link ~* '^(https://([[:alnum:]_-]+\.)+[[:alnum:]_-]+(/[[:alnum:]_\-./?%&=]*)?|mailto:[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$') THEN
      RAISE EXCEPTION USING ERRCODE= '22000', MESSAGE= 'Invalid URL format. URLs must use HTTPS protocol or be a valid mailto link.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "validate_support_link_url"
BEFORE INSERT OR UPDATE ON "public"."app_metadata"
FOR EACH ROW
EXECUTE FUNCTION validate_support_link();
