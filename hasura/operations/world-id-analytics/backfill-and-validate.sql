-- Operator runbook: execute only after nullifier_created_at_idx is valid.
-- Size statement_timeout for the complete production history.
SELECT * FROM public.rollup_world_id_analytics();

-- Record these results as release evidence before enabling product reads.
SELECT count(*) AS uses_zero_count, min(created_at), max(created_at)
FROM public.nullifier
WHERE uses = 0;

SELECT schemaname, indexname, indexdef
FROM pg_indexes
WHERE indexname IN (
  'nullifier_created_at_idx',
  'nullifier_v4_created_at_idx'
);
