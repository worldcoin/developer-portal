CREATE TABLE public.session_verification_v4 (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  rp_id VARCHAR(50) NOT NULL,
  environment public.action_environment NOT NULL,
  session_id TEXT NOT NULL,
  successful_results INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX session_verification_v4_created_at_idx
  ON public.session_verification_v4 (created_at);

CREATE TABLE public.session_v4_stats_daily (
  rp_id VARCHAR(50) NOT NULL,
  environment public.action_environment NOT NULL,
  date_utc DATE NOT NULL,
  sessions BIGINT NOT NULL,
  successful_results BIGINT NOT NULL,
  PRIMARY KEY (rp_id, environment, date_utc)
);

CREATE INDEX session_v4_stats_daily_date_idx
  ON public.session_v4_stats_daily (date_utc);

CREATE OR REPLACE FUNCTION public.rollup_v4_analytics()
RETURNS SETOF public.v4_analytics_state
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
  cutoff TIMESTAMPTZ;
  start_ts TIMESTAMPTZ;
  start_date DATE;
  session_start DATE;
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

  SELECT GREATEST(
    start_date,
    (
      COALESCE(
        (
          SELECT timestamp_value
          FROM public.v4_analytics_state
          WHERE key = 'pruned_through'
        ),
        '-infinity'::TIMESTAMPTZ
      ) AT TIME ZONE 'UTC'
    )::DATE + 1
  )
  INTO session_start;

  DELETE FROM public.session_v4_stats_daily
  WHERE date_utc >= session_start;

  INSERT INTO public.session_v4_stats_daily (
    rp_id,
    environment,
    date_utc,
    sessions,
    successful_results
  )
  SELECT
    rp_id,
    environment,
    (created_at AT TIME ZONE 'UTC')::DATE,
    COUNT(*)::BIGINT,
    SUM(successful_results)::BIGINT
  FROM public.session_verification_v4
  WHERE created_at >= (session_start::TIMESTAMP AT TIME ZONE 'UTC')
    AND created_at < cutoff
  GROUP BY rp_id, environment, (created_at AT TIME ZONE 'UTC')::DATE;

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

CREATE OR REPLACE FUNCTION public.prune_session_verifications()
RETURNS SETOF public.v4_analytics_state
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
  processed_through TIMESTAMPTZ;
  prune_threshold TIMESTAMPTZ;
BEGIN
  IF NOT pg_try_advisory_xact_lock(533214, 43) THEN
    RAISE NOTICE 'v4 analytics maintenance is already running';
    RETURN;
  END IF;

  SELECT timestamp_value
  INTO processed_through
  FROM public.v4_analytics_state
  WHERE key = 'processed_through';

  IF processed_through IS NULL THEN
    RETURN;
  END IF;

  prune_threshold := LEAST(
    now() - INTERVAL '30 days',
    processed_through - INTERVAL '25 hours'
  );

  DELETE FROM public.session_verification_v4
  WHERE created_at < prune_threshold;

  RETURN QUERY
  INSERT INTO public.v4_analytics_state (key, timestamp_value)
  VALUES ('pruned_through', prune_threshold)
  ON CONFLICT (key) DO UPDATE
    SET timestamp_value = GREATEST(
      v4_analytics_state.timestamp_value,
      EXCLUDED.timestamp_value
    )
  RETURNING
    v4_analytics_state.key,
    v4_analytics_state.timestamp_value;
END;
$$;
