-- Run out of band before enabling the v3 rollup leg. Hasura migrations are
-- transactional, so this deliberately does not live in a migration.
CREATE INDEX CONCURRENTLY IF NOT EXISTS nullifier_created_at_idx
  ON public.nullifier (created_at);
