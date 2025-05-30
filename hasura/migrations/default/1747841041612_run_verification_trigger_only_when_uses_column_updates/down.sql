-- Revert to the old trigger that runs on every update
CREATE OR REPLACE TRIGGER enforce_uses_limit
BEFORE UPDATE ON nullifier
FOR EACH ROW
EXECUTE FUNCTION check_nullifier_uses_limit();
