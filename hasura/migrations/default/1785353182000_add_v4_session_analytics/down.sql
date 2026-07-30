DROP FUNCTION IF EXISTS public.prune_session_verifications();

CREATE OR REPLACE FUNCTION public.rollup_v4_analytics()
RETURNS SETOF public.v4_analytics_state
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
  cutoff TIMESTAMPTZ;
  start_ts TIMESTAMPTZ;
  start_date DATE;
BEGIN
  IF NOT pg_try_advisory_xact_lock(533214, 43) THEN
    RAISE NOTICE 'rollup_v4_analytics is already running';
    RETURN;
  END IF;

  cutoff := now() - INTERVAL '5 minutes';

  SELECT LEAST(
    COALESCE(
      (
        SELECT timestamp_value
        FROM public.v4_analytics_state
        WHERE key = 'processed_through'
      ),
      '-infinity'::TIMESTAMPTZ
    ),
    cutoff - INTERVAL '25 hours'
  )
  INTO start_ts;

  start_date := (start_ts AT TIME ZONE 'UTC')::DATE;

  DELETE FROM public.action_v4_stats_daily
  WHERE date_utc >= start_date;

  INSERT INTO public.action_v4_stats_daily (
    action_v4_id,
    date_utc,
    unique_count,
    latest_at
  )
  SELECT
    action_v4_id,
    (created_at AT TIME ZONE 'UTC')::DATE,
    COUNT(*)::BIGINT,
    MAX(created_at)
  FROM public.nullifier_v4
  WHERE created_at >= (start_date::TIMESTAMP AT TIME ZONE 'UTC')
    AND created_at < cutoff
  GROUP BY action_v4_id, (created_at AT TIME ZONE 'UTC')::DATE;

  RETURN QUERY
  INSERT INTO public.v4_analytics_state (key, timestamp_value)
  VALUES ('processed_through', cutoff)
  ON CONFLICT (key) DO UPDATE
    SET timestamp_value = EXCLUDED.timestamp_value
  RETURNING
    v4_analytics_state.key,
    v4_analytics_state.timestamp_value;
END;
$$;

DROP TABLE IF EXISTS public.session_v4_stats_daily;
DROP TABLE IF EXISTS public.session_verification_v4;
