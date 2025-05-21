CREATE OR REPLACE TRIGGER enforce_uses_limit
BEFORE UPDATE OF uses ON nullifier
FOR EACH ROW
WHEN (OLD.uses IS DISTINCT FROM NEW.uses)
EXECUTE FUNCTION check_nullifier_uses_limit();
