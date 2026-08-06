\set ON_ERROR_STOP on

-- Parity validation gate. Operator runbook:
-- 1. Execute only after both created_at indexes are valid
--    (create-nullifier-created-at-index.sql).
-- 2. Build history first through the dated backfill endpoint: POST
--    /_rollup-world-id-analytics with {"from_date","to_date"} ranges until
--    every call returns an empty failed_ranges. This script does not backfill;
--    it proves the result.
-- 3. Run this before enabling WORLD_ID_ANALYTICS_ROLLUP_ENABLED (a concurrent
--    cron tick would only wait on the advisory lock, but the gate should pass
--    before the recurring rollup exists at all).
-- 4. On a parity failure, the sample rows below identify the bad action/days:
--    re-POST exactly those date ranges (the rebuild both recounts wrong days
--    and sweeps rolled rows whose raw rows were deleted), then rerun this
--    script. No reset step exists or is needed.
-- 5. The comparison covers every complete UTC day; today is deliberately
--    excluded because it is still accumulating.
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

-- One repeatable-read snapshot for the catch-up and the comparison, so both
-- observe the same canonical source rows even while verifications keep
-- landing. The catch-up rebuilds the trailing window inside this snapshot;
-- history must already be in place (runbook step 2).
BEGIN ISOLATION LEVEL REPEATABLE READ;

SET LOCAL lock_timeout = '30s';

SELECT count(*) AS catch_up_days
FROM public.rollup_world_id_analytics(NULL::date, NULL::date);

-- Compare every complete UTC day in both directions. A total-only comparison
-- could hide compensating errors; a one-direction comparison would miss rolled
-- rows whose raw rows no longer exist.
CREATE TEMP TABLE analytics_gate_mismatches
ON COMMIT DROP
AS
WITH bound AS (
  SELECT ((now() - interval '5 minutes') AT TIME ZONE 'UTC')::date AS first_incomplete_day
),
canonical AS (
  SELECT
    'legacy'::text AS source,
    raw.action_id,
    (raw.created_at AT TIME ZONE 'UTC')::date AS date_utc,
    count(*)::bigint AS unique_count
  FROM public.nullifier AS raw
  CROSS JOIN bound
  WHERE raw.created_at
    < (bound.first_incomplete_day::timestamp AT TIME ZONE 'UTC')
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
  CROSS JOIN bound
  WHERE raw.created_at
    < (bound.first_incomplete_day::timestamp AT TIME ZONE 'UTC')
  GROUP BY
    raw.action_v4_id,
    (raw.created_at AT TIME ZONE 'UTC')::date
),
rolled AS (
  SELECT
    'legacy'::text AS source,
    daily.action_id,
    daily.date_utc,
    daily.unique_count
  FROM public.action_legacy_stats_daily AS daily
  CROSS JOIN bound
  WHERE daily.date_utc < bound.first_incomplete_day

  UNION ALL

  SELECT
    'v4',
    daily.action_v4_id,
    daily.date_utc,
    daily.unique_count
  FROM public.action_v4_stats_daily AS daily
  CROSS JOIN bound
  WHERE daily.date_utc < bound.first_incomplete_day
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

-- Print a bounded diagnostic sample before failing the gate; these rows are
-- the exact ranges to re-POST.
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

-- Record these results as release evidence before enabling the cron or
-- product reads.
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
