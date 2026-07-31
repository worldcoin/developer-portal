\set ON_ERROR_STOP on

-- Operator runbook:
-- 1. Execute only after nullifier_created_at_idx is valid.
-- 2. Set a statement_timeout long enough for the complete production history.
-- 3. Keep WORLD_ID_ANALYTICS_ROLLUP_ENABLED disabled until this script passes.
CREATE TEMP TABLE analytics_gate_evidence (
  phase text PRIMARY KEY,
  processed_through timestamptz NOT NULL
) ON COMMIT PRESERVE ROWS;

-- Phase one: build the complete historical rollup. The function deliberately
-- returns zero rows when another transaction owns its advisory lock, so turn
-- that otherwise-successful no-op into a deployment failure.
BEGIN;

INSERT INTO analytics_gate_evidence (phase, processed_through)
SELECT 'historical_backfill', processed_through
FROM public.rollup_world_id_analytics();

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
        'Historical analytics backfill did not acquire the advisory lock';
  END IF;
END
$gate$;

COMMIT;

-- Phase two: rebuild the overlap so rows committed during the historical scan
-- are included. Keep this transaction open through parity validation so its
-- advisory lock prevents cron from moving the watermark underneath the check.
BEGIN;

INSERT INTO analytics_gate_evidence (phase, processed_through)
SELECT 'catch_up', processed_through
FROM public.rollup_world_id_analytics();

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

-- Compare every v4 action/day/count through the catch-up watermark in both
-- directions. A total-only comparison could hide compensating errors.
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
    source.action_v4_id,
    (source.created_at AT TIME ZONE 'UTC')::date AS date_utc,
    count(*)::bigint AS unique_count
  FROM public.nullifier_v4 AS source
  CROSS JOIN watermark
  WHERE source.created_at < watermark.processed_through
  GROUP BY
    source.action_v4_id,
    (source.created_at AT TIME ZONE 'UTC')::date
),
rolled AS (
  SELECT action_v4_id, date_utc, unique_count
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
ORDER BY direction, action_v4_id, date_utc
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
      'Raw-v4/rollup parity validation failed with % difference(s)',
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

SELECT schemaname, indexname, indexdef
FROM pg_indexes
WHERE indexname IN (
  'nullifier_created_at_idx',
  'nullifier_v4_created_at_idx'
);
