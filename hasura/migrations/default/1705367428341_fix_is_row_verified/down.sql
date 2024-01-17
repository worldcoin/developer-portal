CREATE FUNCTION set_is_row_verified()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.verification_status = 'verified' THEN
    NEW.is_row_verified := false;
  ELSE
    NEW.is_row_verified := true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
