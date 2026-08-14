CREATE TABLE public.action_legacy_stats_daily (
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

CREATE INDEX action_legacy_stats_daily_date_idx
  ON public.action_legacy_stats_daily (date_utc);
CREATE INDEX action_v4_stats_daily_date_idx
  ON public.action_v4_stats_daily (date_utc);

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
    FROM public.action_legacy_stats_daily daily
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

-- Stateless window rebuild: delete the window's rolled days and recount them
-- from the raw nullifier tables. Passing no dates rebuilds the standard
-- trailing window (the last ~25 hours); explicit dates rebuild exactly that
-- inclusive range, which is also how any suspect range is repaired.
CREATE OR REPLACE FUNCTION public.rollup_world_id_analytics(
  from_date date,
  to_date date
)
RETURNS SETOF public.world_id_app_stats_daily
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
  cutoff timestamptz := clock_timestamp() - interval '5 minutes';
  window_start date;
  window_end date;
  rebuild_until timestamptz;
BEGIN
  IF (from_date IS NULL) <> (to_date IS NULL) THEN
    RAISE EXCEPTION 'from_date and to_date must be supplied together';
  END IF;

  window_start := COALESCE(
    from_date,
    ((cutoff - interval '25 hours') AT TIME ZONE 'UTC')::date
  );
  window_end := COALESCE(to_date, (cutoff AT TIME ZONE 'UTC')::date);

  IF window_start > window_end THEN
    RAISE EXCEPTION 'from_date % is after to_date %', window_start, window_end;
  END IF;

  -- Never count the racing 5 minutes: rows may still be committing there, and
  -- a later run's window always re-covers them.
  rebuild_until := LEAST(
    (window_end + 1)::timestamp AT TIME ZONE 'UTC',
    cutoff
  );

  IF window_start::timestamp AT TIME ZONE 'UTC' >= rebuild_until THEN
    RETURN;
  END IF;

  -- Serialize concurrent runs (cron ticks, backfill chunks, parity catch-up).
  -- Blocking rather than try-lock: Hasura hides Postgres SQLSTATEs from
  -- non-admin roles, so the route could not tell a lock miss from a failure.
  -- Waiters are bounded by the caller's request timeout.
  PERFORM pg_advisory_xact_lock(533214, 43);

  -- Take the recount's parent locks BEFORE touching child rows. Without
  -- this, a concurrent action deletion (parent row first, then a cascade
  -- into the very child rows this window just deleted) forms a lock cycle
  -- whose victim is nearly always the user's delete (40P01, reproduced
  -- 3/3). Parent-before-child on both sides removes the cycle: the delete
  -- briefly waits for this transaction, then cascades cleanly.
  PERFORM 1
    FROM public.action locked_action
   WHERE locked_action.id IN (
       SELECT DISTINCT n.action_id
         FROM public.nullifier n
        WHERE n.created_at >= (window_start::timestamp AT TIME ZONE 'UTC')
          AND n.created_at < rebuild_until
     )
   ORDER BY locked_action.id
   FOR KEY SHARE OF locked_action;

  PERFORM 1
    FROM public.action_v4 locked_action
   WHERE locked_action.id IN (
       SELECT DISTINCT n.action_v4_id
         FROM public.nullifier_v4 n
        WHERE n.created_at >= (window_start::timestamp AT TIME ZONE 'UTC')
          AND n.created_at < rebuild_until
     )
   ORDER BY locked_action.id
   FOR KEY SHARE OF locked_action;

  DELETE FROM public.action_legacy_stats_daily
   WHERE date_utc BETWEEN window_start AND window_end;
  DELETE FROM public.action_v4_stats_daily
   WHERE date_utc BETWEEN window_start AND window_end;

  INSERT INTO public.action_legacy_stats_daily (action_id, date_utc, unique_count)
  SELECT n.action_id, (n.created_at AT TIME ZONE 'UTC')::date, count(*)::bigint
    FROM public.nullifier n
    JOIN public.action a ON a.id = n.action_id
   WHERE n.created_at >= (window_start::timestamp AT TIME ZONE 'UTC')
     AND n.created_at < rebuild_until
   GROUP BY n.action_id, (n.created_at AT TIME ZONE 'UTC')::date;

  INSERT INTO public.action_v4_stats_daily (action_v4_id, date_utc, unique_count)
  SELECT n.action_v4_id, (n.created_at AT TIME ZONE 'UTC')::date, count(*)::bigint
    FROM public.nullifier_v4 n
    JOIN public.action_v4 a ON a.id = n.action_v4_id
   WHERE n.created_at >= (window_start::timestamp AT TIME ZONE 'UTC')
     AND n.created_at < rebuild_until
   GROUP BY n.action_v4_id, (n.created_at AT TIME ZONE 'UTC')::date;

  RETURN QUERY
  SELECT combined.date_utc, sum(combined.unique_count)::bigint
  FROM (
    SELECT daily.date_utc, daily.unique_count
      FROM public.action_legacy_stats_daily daily
     WHERE daily.date_utc BETWEEN window_start AND window_end
    UNION ALL
    SELECT daily.date_utc, daily.unique_count
      FROM public.action_v4_stats_daily daily
     WHERE daily.date_utc BETWEEN window_start AND window_end
  ) combined
  GROUP BY combined.date_utc
  ORDER BY combined.date_utc;
END
$$;

COMMENT ON TABLE public.world_id_app_stats_daily IS
  'Empty tracked return shape for the service-only app analytics SQL functions.';
