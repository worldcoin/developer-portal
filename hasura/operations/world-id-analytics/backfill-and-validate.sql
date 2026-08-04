\set ON_ERROR_STOP on

-- Operator runbook:
-- 1. Execute only after both created_at indexes are valid
--    (create-nullifier-created-at-index.sql).
-- 2. Set a statement_timeout long enough for the busiest single day of
--    production history (the backfill commits one day-sized chunk at a time).
-- 3. Keep WORLD_ID_ANALYTICS_ROLLUP_ENABLED disabled until this script passes.
-- 4. An interrupted run is safe to rerun as-is: the backfill resumes from the
--    committed watermark. Only after a *parity validation failure* below must
--    the rollup state be rebuilt from scratch — run
--      UPDATE public.world_id_analytics_state
--         SET processed_through = '-infinity' WHERE singleton;
--    and then rerun this script.
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
      HINT = 'Run DROP INDEX CONCURRENTLY IF EXISTS public.nullifier_created_at_idx; then rerun create-nullifier-created-at-index.sql';
  END IF;
END
$index_gate$;

DO $index_gate$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_index
    WHERE indexrelid = to_regclass('public.nullifier_v4_created_at_idx')
      AND indrelid = 'public.nullifier_v4'::regclass
      AND indisready
      AND indisvalid
  ) THEN
    RAISE EXCEPTION USING
      MESSAGE = 'nullifier_v4_created_at_idx is missing or invalid',
      HINT = 'Run DROP INDEX CONCURRENTLY IF EXISTS public.nullifier_v4_created_at_idx; then rerun create-nullifier-created-at-index.sql';
  END IF;
END
$index_gate$;

CREATE TEMP TABLE analytics_gate_evidence (
  phase text PRIMARY KEY,
  processed_through timestamptz NOT NULL
) ON COMMIT PRESERVE ROWS;

-- Phase one: rebuild history in bounded one-day chunks. Each chunk commits
-- and advances the watermark, so progress is observable while it runs
-- (SELECT processed_through FROM world_id_analytics_state) and an
-- interrupted run resumes instead of restarting. The watermark is
-- deliberately not reset here — see runbook step 4 for the one case that
-- needs it. The procedure aborts loudly if any chunk cannot acquire the
-- rollup advisory lock.
CALL public.backfill_world_id_analytics(1);

BEGIN;

INSERT INTO analytics_gate_evidence (phase, processed_through)
SELECT 'historical_backfill', processed_through
FROM public.world_id_analytics_state
WHERE singleton AND isfinite(processed_through);

DO $gate$
BEGIN
  IF (
    SELECT count(*)
    FROM pg_temp.analytics_gate_evidence
    WHERE phase = 'historical_backfill'
  ) <> 1 THEN
    RAISE EXCEPTION USING
      ERRCODE = '55P03',
      MESSAGE =
        'Historical analytics backfill left no finite watermark';
  END IF;
END
$gate$;

COMMIT;

-- Phase two gets a fresh snapshot containing writes committed during the
-- historical scan. Keep one repeatable-read snapshot through catch-up and
-- parity validation so both observe the same canonical source rows.
BEGIN ISOLATION LEVEL REPEATABLE READ;

INSERT INTO analytics_gate_evidence (phase, processed_through)
SELECT 'catch_up', processed_through
FROM public.rollup_world_id_analytics(NULL::integer);

DO $gate$
BEGIN
  IF (
    SELECT count(*)
    FROM pg_temp.analytics_gate_evidence
    WHERE phase = 'catch_up'
  ) <> 1 THEN
    RAISE EXCEPTION USING
      ERRCODE = '55P03',
      MESSAGE = 'Analytics catch-up did not acquire the advisory lock';
  END IF;
END
$gate$;

-- Compare every v3 and v4 action/day/count through the catch-up watermark in
-- both directions. A total-only comparison could hide compensating errors.
CREATE TEMP TABLE analytics_gate_mismatches
ON COMMIT DROP
AS
WITH watermark AS (
  SELECT processed_through
  FROM pg_temp.analytics_gate_evidence
  WHERE phase = 'catch_up'
),
canonical AS (
  SELECT
    'legacy'::text AS source,
    raw.action_id,
    (raw.created_at AT TIME ZONE 'UTC')::date AS date_utc,
    count(*)::bigint AS unique_count
  FROM public.nullifier AS raw
  CROSS JOIN watermark
  WHERE raw.created_at < watermark.processed_through
  GROUP BY
    raw.action_id,
    (raw.created_at AT TIME ZONE 'UTC')::date

  UNION ALL

  SELECT
    'v4',
    raw.action_v4_id,
    (raw.created_at AT TIME ZONE 'UTC')::date AS date_utc,
    count(*)::bigint AS unique_count
  FROM public.nullifier_v4 AS raw
  CROSS JOIN watermark
  WHERE raw.created_at < watermark.processed_through
  GROUP BY
    raw.action_v4_id,
    (raw.created_at AT TIME ZONE 'UTC')::date
),
rolled AS (
  SELECT
    'legacy'::text AS source,
    action_id,
    date_utc,
    unique_count
  FROM public.action_legacy_stats_daily

  UNION ALL

  SELECT
    'v4',
    action_v4_id,
    date_utc,
    unique_count
  FROM public.action_v4_stats_daily
),
canonical_minus_rolled AS (
  SELECT * FROM canonical
  EXCEPT
  SELECT * FROM rolled
),
rolled_minus_canonical AS (
  SELECT * FROM rolled
  EXCEPT
  SELECT * FROM canonical
)
SELECT
  'canonical_missing_or_mismatched'::text AS direction,
  *
FROM canonical_minus_rolled
UNION ALL
SELECT
  'rollup_extra_or_mismatched',
  *
FROM rolled_minus_canonical;

-- Print a bounded diagnostic sample before failing the deployment.
SELECT *
FROM analytics_gate_mismatches
ORDER BY direction, source, action_id, date_utc
LIMIT 20;

DO $gate$
DECLARE
  mismatch_count bigint;
BEGIN
  SELECT count(*)
  INTO mismatch_count
  FROM pg_temp.analytics_gate_mismatches;

  IF mismatch_count <> 0 THEN
    RAISE EXCEPTION
      'Raw/rollup parity validation failed with % difference(s)',
      mismatch_count;
  END IF;
END
$gate$;

COMMIT;

-- Record these results as release evidence before enabling cron or product
-- reads.
TABLE analytics_gate_evidence;

SELECT count(*) AS uses_zero_count, min(created_at), max(created_at)
FROM public.nullifier
WHERE uses = 0;

SELECT view.schemaname, view.indexname,
       catalog.indisready, catalog.indisvalid, view.indexdef
FROM pg_indexes AS view
JOIN pg_index AS catalog
  ON catalog.indexrelid =
    to_regclass(format('%I.%I', view.schemaname, view.indexname))
WHERE view.schemaname = 'public'
  AND view.indexname IN (
  'nullifier_created_at_idx',
  'nullifier_v4_created_at_idx'
);
