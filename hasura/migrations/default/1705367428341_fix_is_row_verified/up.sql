CREATE OR REPLACE FUNCTION set_is_row_verified()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.verification_status = 'verified' THEN
    NEW.is_row_verified := true;
  ELSE
    NEW.is_row_verified := false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;