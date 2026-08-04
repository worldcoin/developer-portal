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

-- max_advance_days caps how far one call may move the watermark; NULL means
-- unbounded. The rebuild start is always derived from the watermark, never
-- caller-supplied, so no sequence of calls can skip a range.
CREATE OR REPLACE FUNCTION public.rollup_world_id_analytics(
  max_advance_days integer
)
RETURNS SETOF public.world_id_analytics_state
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
  cutoff timestamptz := clock_timestamp() - interval '5 minutes';
  watermark timestamptz;
  rebuild_from timestamptz;
  rebuild_date date;
  target timestamptz;
BEGIN
  IF max_advance_days < 1 THEN
    RAISE EXCEPTION 'max_advance_days must be NULL or at least 1';
  END IF;

  IF NOT pg_try_advisory_xact_lock(533214, 43) THEN
    RETURN;
  END IF;


  INSERT INTO public.world_id_analytics_state (singleton, processed_through)
  VALUES (true, '-infinity')
  ON CONFLICT (singleton) DO NOTHING;

  SELECT processed_through,
         LEAST(processed_through, cutoff - interval '25 hours')
    INTO watermark, rebuild_from
    FROM public.world_id_analytics_state
    WHERE singleton;

  -- '-infinity' plus any interval is still '-infinity', so a capped call
  -- must anchor its first chunk at the oldest raw row instead.
  IF max_advance_days IS NOT NULL AND rebuild_from = '-infinity' THEN
    SELECT LEAST(
        (SELECT min(created_at) FROM public.nullifier),
        (SELECT min(created_at) FROM public.nullifier_v4)
      )
      INTO rebuild_from;

    IF rebuild_from IS NULL THEN
      UPDATE public.world_id_analytics_state
         SET processed_through = GREATEST(processed_through, cutoff)
       WHERE singleton;
      RETURN QUERY SELECT * FROM public.world_id_analytics_state WHERE singleton;
      RETURN;
    END IF;
  END IF;

  rebuild_date := (rebuild_from AT TIME ZONE 'UTC')::date;

  -- Chunks advance in whole UTC days from the rebuild date, so every chunk
  -- boundary lands on a midnight and the next chunk starts on its own day.
  target := LEAST(
    cutoff,
    COALESCE(
      (rebuild_date + max_advance_days)::timestamp AT TIME ZONE 'UTC',
      cutoff
    )
  );

  -- The 25-hour overlap can pull rebuild_from a full day behind the
  -- watermark, where a small day-aligned cap lands on a boundary the
  -- watermark already passed and the call would never advance. The span
  -- left at that point is at most the overlap window, so finish at the
  -- cutoff instead.
  IF target <= watermark THEN
    target := cutoff;
  END IF;

  DELETE FROM public.action_legacy_stats_daily
   WHERE date_utc BETWEEN rebuild_date AND (target AT TIME ZONE 'UTC')::date;
  DELETE FROM public.action_v4_stats_daily
   WHERE date_utc BETWEEN rebuild_date AND (target AT TIME ZONE 'UTC')::date;

  INSERT INTO public.action_legacy_stats_daily (action_id, date_utc, unique_count)
  SELECT n.action_id, (n.created_at AT TIME ZONE 'UTC')::date, count(*)::bigint
    FROM public.nullifier n
    JOIN public.action a ON a.id = n.action_id
   WHERE n.created_at >= (rebuild_date::timestamp AT TIME ZONE 'UTC')
     AND n.created_at < target
   GROUP BY n.action_id, (n.created_at AT TIME ZONE 'UTC')::date;

  INSERT INTO public.action_v4_stats_daily (action_v4_id, date_utc, unique_count)
  SELECT n.action_v4_id, (n.created_at AT TIME ZONE 'UTC')::date, count(*)::bigint
    FROM public.nullifier_v4 n
    JOIN public.action_v4 a ON a.id = n.action_v4_id
   WHERE n.created_at >= (rebuild_date::timestamp AT TIME ZONE 'UTC')
     AND n.created_at < target
   GROUP BY n.action_v4_id, (n.created_at AT TIME ZONE 'UTC')::date;

  UPDATE public.world_id_analytics_state
     SET processed_through = GREATEST(processed_through, target)
   WHERE singleton;

  RETURN QUERY SELECT * FROM public.world_id_analytics_state WHERE singleton;
END
$$;

-- Operator-only backfill driver (not tracked by Hasura). Runs the rollup one
-- chunk at a time and commits between chunks, so an interrupted backfill
-- keeps its progress and a rerun resumes from the committed watermark.
CREATE OR REPLACE PROCEDURE public.backfill_world_id_analytics(
  chunk_days integer DEFAULT 1
)
LANGUAGE plpgsql
AS $$
DECLARE
  state public.world_id_analytics_state;
  previous timestamptz;
  chunk bigint := 0;
BEGIN
  IF chunk_days IS NULL OR chunk_days < 1 THEN
    RAISE EXCEPTION 'chunk_days must be at least 1';
  END IF;

  LOOP
    SELECT * INTO state
      FROM public.rollup_world_id_analytics(chunk_days);

    IF state IS NULL THEN
      RAISE EXCEPTION USING
        ERRCODE = '55P03',
        MESSAGE =
          'World ID analytics backfill did not acquire the advisory lock';
    END IF;

    -- A healthy chunk always advances the watermark (its target is past the
    -- watermark or clamped to a fresh cutoff). Abort rather than spin if a
    -- regression ever breaks that invariant.
    IF state.processed_through <= previous THEN
      RAISE EXCEPTION
        'World ID analytics backfill made no progress past %', previous;
    END IF;
    previous := state.processed_through;

    COMMIT;

    chunk := chunk + 1;
    RAISE NOTICE 'World ID analytics backfill chunk % processed through %',
      chunk, state.processed_through;

    -- The rollup never advances past its own cutoff (5 minutes before the
    -- call), so a watermark within 6 minutes of now means the last chunk was
    -- clamped to its cutoff: caught up.
    EXIT WHEN state.processed_through >=
      clock_timestamp() - interval '6 minutes';
  END LOOP;
END
$$;

COMMENT ON TABLE public.world_id_app_stats_daily IS
  'Empty tracked return shape for the service-only app analytics SQL function.';
