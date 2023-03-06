CREATE TABLE "public"."redirect" (
  "id" varchar(50) NOT NULL DEFAULT gen_random_friendly_id('uri'), 
  "created_at" timestamptz NOT NULL DEFAULT now(), 
  "updated_at" timestamptz NOT NULL DEFAULT now(), 
  "action_id" varchar(50) NOT NULL, 
  "redirect_uri" varchar(256) NOT NULL, 
  PRIMARY KEY ("id"),
  FOREIGN KEY ("action_id") REFERENCES "public"."action" ("id") ON UPDATE RESTRICT ON DELETE CASCADE,
  UNIQUE ("id")
);

CREATE TRIGGER "set_public_redirect_updated_at"
BEFORE UPDATE ON "public"."redirect"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_redirect_updated_at" ON "public"."redirect" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';


CREATE OR REPLACE FUNCTION validate_url()
RETURNS TRIGGER AS $$
DECLARE
  url text;
BEGIN
  url := NEW.redirect_uri;
  IF url IS NOT NULL AND url != '' THEN
    
    IF strpos(url, 'http://localhost') = 1 THEN
      IF NOT (url ~* '^https?://localhost(:[0-9]+)?(/[^\s?]*)(\\?[^\s]*)?$') THEN
        RAISE EXCEPTION 'Invalid localhost URL format.';
      END IF;
    ELSE
      -- if url is not localhost, it must use https protocol
      IF strpos(url, 'https://') = 0 THEN
        RAISE EXCEPTION 'URL must use HTTPS protocol unless it is localhost.';
      END IF;
      IF NOT (url ~* '^https://([[:alnum:]_-]+\.)+[[:alnum:]_-]+(/[[:alnum:]_\-./?%&=]*)?$') THEN
        RAISE EXCEPTION 'Invalid URL format.';
      END IF;
    END IF;
   
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "validate_redirect_uri_on_redirect"
BEFORE INSERT OR UPDATE ON "public"."redirect"
FOR EACH ROW
EXECUTE FUNCTION validate_url();