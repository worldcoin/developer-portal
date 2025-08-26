-- function to prevent changes to verification_status when it's already 'verified'
CREATE OR REPLACE FUNCTION prevent_verified_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- check if the old verification_status was 'verified' and it's being changed
  IF OLD.verification_status = 'verified' AND OLD.verification_status IS DISTINCT FROM NEW.verification_status THEN
    RAISE EXCEPTION USING 
      ERRCODE = '22000', 
      MESSAGE = 'Cannot change verification_status once it has been set to verified';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- create trigger to enforce the verification status transition check
CREATE TRIGGER app_metadata_verification_status_transition_check
BEFORE UPDATE ON "public"."app_metadata"
FOR EACH ROW
EXECUTE FUNCTION prevent_verified_status_change();
