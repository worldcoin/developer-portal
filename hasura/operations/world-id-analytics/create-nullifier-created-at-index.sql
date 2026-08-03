\set ON_ERROR_STOP on

-- Run out of band before enabling the v3 rollup leg. Hasura migrations are
-- transactional, so this deliberately does not live in a migration.
CREATE INDEX CONCURRENTLY IF NOT EXISTS nullifier_created_at_idx
  ON public.nullifier (created_at);

DO $index_gate$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_index
    WHERE indexrelid = to_regclass('public.nullifier_created_at_idx')
      AND indrelid = 'public.nullifier'::regclass
      AND indisready
      AND indisvalid
  ) THEN
    RAISE EXCEPTION USING
      MESSAGE = 'nullifier_created_at_idx is missing or invalid',
      HINT = 'Run DROP INDEX CONCURRENTLY IF EXISTS public.nullifier_created_at_idx; then rerun this script';
  END IF;
END
$index_gate$;
