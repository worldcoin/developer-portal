CREATE TABLE public.action_v3_stats_daily (
  action_id varchar(50) NOT NULL REFERENCES public.action(id) ON DELETE CASCADE,
  date_utc date NOT NULL,
  unique_count bigint NOT NULL CHECK (unique_count >= 0),
  PRIMARY KEY (action_id, date_utc)
);

CREATE TABLE public.action_v4_stats_daily (
  action_v4_id varchar(50) NOT NULL REFERENCES public.action_v4(id) ON DELETE CASCADE,
  date_utc date NOT NULL,
  unique_count bigint NOT NULL CHECK (unique_count >= 0),
  PRIMARY KEY (action_v4_id, date_utc)
);

CREATE INDEX action_v3_stats_daily_date_idx
  ON public.action_v3_stats_daily (date_utc);
CREATE INDEX action_v4_stats_daily_date_idx
  ON public.action_v4_stats_daily (date_utc);
CREATE INDEX nullifier_v4_created_at_idx
  ON public.nullifier_v4 (created_at);

CREATE TABLE public.world_id_analytics_state (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  processed_through timestamptz NOT NULL
);

CREATE TABLE public.world_id_app_stats_daily (
  date_utc date PRIMARY KEY,
  unique_count bigint NOT NULL
);

CREATE OR REPLACE FUNCTION public.world_id_analytics_app_daily(
  app_id_input varchar,
  environment_input varchar,
  from_date_input date,
  through_date_input date
)
RETURNS SETOF public.world_id_app_stats_daily
LANGUAGE sql
STABLE
AS $$
  SELECT combined.date_utc, sum(combined.unique_count)::bigint
  FROM (
    SELECT daily.date_utc, daily.unique_count
    FROM public.action_v3_stats_daily daily
    JOIN public.action legacy_action ON legacy_action.id = daily.action_id
    JOIN public.app application ON application.id = legacy_action.app_id
    WHERE application.id = app_id_input
      AND application.deleted_at IS NULL
      AND (
        (environment_input = 'staging' AND application.is_staging)
        OR (environment_input = 'production' AND NOT application.is_staging)
      )
      AND daily.date_utc BETWEEN from_date_input AND through_date_input

    UNION ALL

    SELECT daily.date_utc, daily.unique_count
    FROM public.action_v4_stats_daily daily
    JOIN public.action_v4 action_v4 ON action_v4.id = daily.action_v4_id
    JOIN public.rp_registration registration ON registration.rp_id = action_v4.rp_id
    JOIN public.app application ON application.id = registration.app_id
    WHERE application.id = app_id_input
      AND application.deleted_at IS NULL
      AND action_v4.environment::text = environment_input
      AND daily.date_utc BETWEEN from_date_input AND through_date_input
  ) combined
  GROUP BY combined.date_utc
  ORDER BY combined.date_utc
$$;

CREATE OR REPLACE FUNCTION public.rollup_world_id_analytics()
RETURNS SETOF public.world_id_analytics_state
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
  cutoff timestamptz := clock_timestamp() - interval '5 minutes';
  rebuild_from timestamptz;
  rebuild_date date;
BEGIN
  IF NOT pg_try_advisory_xact_lock(533214, 43) THEN
    RETURN;
  END IF;


  INSERT INTO public.world_id_analytics_state (singleton, processed_through)
  VALUES (true, '-infinity')
  ON CONFLICT (singleton) DO NOTHING;

  SELECT LEAST(processed_through, cutoff - interval '25 hours')
    INTO rebuild_from
    FROM public.world_id_analytics_state
    WHERE singleton;
  rebuild_date := (rebuild_from AT TIME ZONE 'UTC')::date;

  DELETE FROM public.action_v3_stats_daily
   WHERE date_utc >= rebuild_date;
  DELETE FROM public.action_v4_stats_daily
   WHERE date_utc >= rebuild_date;

  INSERT INTO public.action_v3_stats_daily (action_id, date_utc, unique_count)
  SELECT n.action_id, (n.created_at AT TIME ZONE 'UTC')::date, count(*)::bigint
    FROM public.nullifier n
    JOIN public.action a ON a.id = n.action_id
   WHERE n.created_at >= (rebuild_date::timestamp AT TIME ZONE 'UTC')
     AND n.created_at < cutoff
   GROUP BY n.action_id, (n.created_at AT TIME ZONE 'UTC')::date;

  INSERT INTO public.action_v4_stats_daily (action_v4_id, date_utc, unique_count)
  SELECT n.action_v4_id, (n.created_at AT TIME ZONE 'UTC')::date, count(*)::bigint
    FROM public.nullifier_v4 n
    JOIN public.action_v4 a ON a.id = n.action_v4_id
   WHERE n.created_at >= (rebuild_date::timestamp AT TIME ZONE 'UTC')
     AND n.created_at < cutoff
   GROUP BY n.action_v4_id, (n.created_at AT TIME ZONE 'UTC')::date;

  UPDATE public.world_id_analytics_state
     SET processed_through = GREATEST(processed_through, cutoff)
   WHERE singleton;

  RETURN QUERY SELECT * FROM public.world_id_analytics_state WHERE singleton;
END
$$;

COMMENT ON TABLE public.world_id_app_stats_daily IS
  'Empty tracked return shape for the service-only app analytics SQL function.';
