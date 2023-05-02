CREATE OR REPLACE FUNCTION validate_url()
RETURNS TRIGGER AS $$
DECLARE
  url text;
BEGIN
  url := NEW.redirect_uri;
  IF url IS NOT NULL AND url != '' THEN
    
    IF strpos(url, 'http://localhost') = 1 OR strpos(url, 'https://localhost') = 1 THEN
      IF NOT (url ~* '^https?://localhost(:[0-9]+)?(/[^\s?]*)(\\?[^\s]*)?$') THEN
        RAISE EXCEPTION USING ERRCODE= '22000', MESSAGE= 'Invalid localhost URL format.';
      END IF;
    ELSE
      IF NOT (url ~* '^https?://([[:alnum:]_-]+\.)+[[:alnum:]_-]+(/[[:alnum:]_\-./?%&=]*)?$') THEN
        RAISE EXCEPTION USING ERRCODE= '22000', MESSAGE= 'Invalid URL format.';
      END IF;
      -- if url is not localhost, it must use https protocol
      IF strpos(url, 'https://') = 0 THEN
        RAISE EXCEPTION USING ERRCODE= '22000', MESSAGE= 'URL must use HTTPS protocol unless it is localhost.';
      END IF;
    END IF;
   
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;