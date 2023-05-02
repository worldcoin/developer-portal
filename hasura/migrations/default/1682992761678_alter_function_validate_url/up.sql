CREATE OR REPLACE FUNCTION validate_url()
RETURNS TRIGGER AS $$
DECLARE
  url text;
BEGIN
  url := NEW.redirect_uri;
  IF url IS NOT NULL AND url != '' THEN
    
    IF strpos(url, '://localhost') > 0 THEN
      IF NOT (url ~* '^[[:alnum:]_-]+://localhost(:[0-9]+)?(/[^\s?]*)?(\\?[^\s]*)?$') THEN
        RAISE EXCEPTION USING ERRCODE= '22000', MESSAGE= 'Invalid localhost URL format.';
      END IF;
    ELSE
      IF NOT (url ~* '^(?!http:\/\/)[[:alnum:].+-]+://[^\s?]*(\\?[^\s]*)?$') THEN
        RAISE EXCEPTION USING ERRCODE= '22000', MESSAGE= 'Invalid URL format.';
      END IF;
    END IF;
   
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
