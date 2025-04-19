-- Revert validation function to original HTTPS-only version
CREATE OR REPLACE FUNCTION validate_single_url(url text)
RETURNS void AS $$
BEGIN
  IF url IS NOT NULL AND url != '' THEN
    IF NOT (
      url ~* '^https://([[:alnum:]_-]+\.)+[[:alnum:]_-]+(/[[:alnum:]_\-./?%&=]*)?$'
    ) THEN
      RAISE EXCEPTION USING ERRCODE='22000', MESSAGE='Invalid URL format. URLs must use HTTPS protocol.';
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;
