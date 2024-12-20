CREATE OR REPLACE FUNCTION validate_whitelist()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.contracts IS NOT NULL AND array_length(NEW.contracts, 1) > 0 THEN
    IF 'all' = ANY (NEW.contracts) THEN
      RAISE EXCEPTION 'Cannot use "all" in contracts array';
    END IF;
  END IF;

  IF NEW.permit2_tokens IS NOT NULL AND array_length(NEW.permit2_tokens, 1) > 0 THEN
    IF 'all' = ANY (NEW.permit2_tokens) THEN
      RAISE EXCEPTION 'Cannot use "all" in permit2_tokens array';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_whitelist
BEFORE INSERT OR UPDATE ON app_metadata
FOR EACH ROW
EXECUTE FUNCTION validate_whitelist();
