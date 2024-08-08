CREATE OR REPLACE FUNCTION validate_single_url(url text)
RETURNS void as $$
BEGIN
  IF url IS NOT NULL AND url != '' THEN
--   Hash parameters are allowed for these URLs
    IF NOT (url ~* 'https?:\/\/') THEN
      RAISE EXCEPTION USING ERRCODE= '22000', MESSAGE= 'Invalid URL format.';
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;
