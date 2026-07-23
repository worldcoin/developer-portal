-- One-shot v4 seed (plan section 5). REPEATABLE READ is asserted inside the function,
-- so this SET must be the first statement of the migration transaction. Writing the
-- 'v4_seed_completed_at' marker arms the gated v4 passes in the rollup and
-- reconciliation functions.
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;

SELECT public.seed_v4_verification_stats();
