CREATE OR REPLACE FUNCTION check_nullifier_uses_limit()
RETURNS TRIGGER 
AS $$
DECLARE
  _max_verifications INTEGER;
BEGIN
  SELECT max_verifications INTO _max_verifications 
  FROM action
  WHERE id = NEW.action_id; 
    
  IF _max_verifications IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '22000', MESSAGE = 'No action found with the specified ID';
  END IF;

  -- Check if uses is less than max_verifications, skip check if max_verifications = 0 (unlimited)
  IF _max_verifications > 0 AND NEW.uses > _max_verifications THEN
    RAISE EXCEPTION USING ERRCODE = '22000', MESSAGE = 'Maximum uses exceeded for this action';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_uses_limit
BEFORE UPDATE ON nullifier
FOR EACH ROW
EXECUTE FUNCTION check_nullifier_uses_limit();
