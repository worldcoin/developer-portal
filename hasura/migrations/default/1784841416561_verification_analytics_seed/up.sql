-- One-shot legacy seed (plan section 5). Must run snapshot-consistent: REPEATABLE READ is
-- asserted inside the function, so this SET must be the first statement of the migration
-- transaction. The function takes the (533214, 42) advisory lock, is marker-guarded, and
-- rolls back atomically with the marker on any failure.
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;

SELECT public.seed_legacy_verification_stats();
