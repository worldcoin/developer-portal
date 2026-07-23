DROP FUNCTION IF EXISTS public.seed_v4_verification_stats();

-- Restore the PR 1 (legacy-only) function bodies verbatim.
CREATE OR REPLACE FUNCTION public.rollup_verification_stats(_until timestamptz DEFAULT NULL)
RETURNS SETOF public.verification_job_returning
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
  _wm public.rollup_watermark%ROWTYPE;
  _u timestamptz;
  _start timestamptz;
  _groups bigint := 0;
BEGIN
  IF NOT pg_try_advisory_xact_lock(533214, 42) THEN
    RETURN QUERY SELECT 'rollup'::text, 'lock_not_acquired'::text, 0::bigint, 0::bigint, 0::bigint, NULL::text;
    RETURN;
  END IF;

  SELECT * INTO _wm FROM public.rollup_watermark WHERE key = 'verification_stats' FOR UPDATE;
  IF NOT FOUND THEN
    -- The seed migration has not completed; there is no safe delta boundary yet.
    RETURN QUERY SELECT 'rollup'::text, 'skipped_no_watermark'::text, 0::bigint, 0::bigint, 0::bigint, NULL::text;
    RETURN;
  END IF;

  _u := COALESCE(_until, now() - interval '5 minutes');
  IF _u <= _wm.last_until THEN
    RETURN QUERY SELECT 'rollup'::text, 'skipped_window_not_advanced'::text, 0::bigint, 0::bigint, 0::bigint, NULL::text;
    RETURN;
  END IF;
  -- 15-minute overlap re-reads late commits; snapshot comparison keeps re-reads idempotent.
  _start := _wm.last_until - interval '15 minutes';

  WITH changed AS (
    SELECT n.nullifier_hash,
           n.action_id,
           n.updated_at,
           n.uses,
           (n.uses - COALESCE(s.last_seen_uses, 0))::bigint AS delta,
           (s.nullifier_hash IS NULL) AS is_new
    FROM public.nullifier n
    LEFT JOIN public.nullifier_uses_seen s ON s.nullifier_hash = n.nullifier_hash
    WHERE n.updated_at >= _start
      AND n.updated_at < _u
      AND n.uses > COALESCE(s.last_seen_uses, 0)
  ),
  with_dims AS (
    SELECT ch.nullifier_hash,
           ch.action_id,
           ch.updated_at,
           ch.uses,
           ch.delta,
           ch.is_new,
           a.app_id,
           CASE WHEN app.is_staging THEN 'staging' ELSE 'production' END AS environment,
           (ch.updated_at AT TIME ZONE 'UTC')::date AS day
    FROM changed ch
    JOIN public.action a ON a.id = ch.action_id
    JOIN public.app ON app.id = a.app_id
  ),
  grouped AS (
    SELECT action_id,
           app_id,
           environment,
           day,
           SUM(delta)::bigint AS verifications,
           (COUNT(*) FILTER (WHERE is_new))::bigint AS uniques,
           SUM(CASE WHEN is_new THEN GREATEST(delta - 1, 0) ELSE delta END)::bigint AS repeats,
           MAX(updated_at) AS latest
    FROM with_dims
    GROUP BY action_id, app_id, environment, day
  ),
  up_action_daily AS (
    INSERT INTO public.action_verification_stats_daily AS t
      (action_id, app_id, source, environment, date, verifications, unique_verifications, repeated_verifications, latest_verification_at)
    SELECT action_id, app_id, 'legacy', environment, day, verifications, uniques, repeats, latest
    FROM grouped
    ON CONFLICT (action_id, source, environment, date) DO UPDATE SET
      verifications = t.verifications + EXCLUDED.verifications,
      unique_verifications = t.unique_verifications + EXCLUDED.unique_verifications,
      repeated_verifications = t.repeated_verifications + EXCLUDED.repeated_verifications,
      latest_verification_at = GREATEST(t.latest_verification_at, EXCLUDED.latest_verification_at),
      updated_at = now()
  ),
  up_action_total AS (
    INSERT INTO public.action_verification_stats_total AS t
      (action_id, app_id, source, environment, verifications, unique_verifications, repeated_verifications, latest_verification_at)
    SELECT action_id, app_id, 'legacy', environment,
           SUM(verifications), SUM(uniques), SUM(repeats), MAX(latest)
    FROM grouped
    GROUP BY action_id, app_id, environment
    ON CONFLICT (action_id, source, environment) DO UPDATE SET
      verifications = t.verifications + EXCLUDED.verifications,
      unique_verifications = t.unique_verifications + EXCLUDED.unique_verifications,
      repeated_verifications = t.repeated_verifications + EXCLUDED.repeated_verifications,
      latest_verification_at = GREATEST(t.latest_verification_at, EXCLUDED.latest_verification_at),
      updated_at = now()
  ),
  up_app_daily AS (
    INSERT INTO public.app_verification_stats_daily AS t
      (app_id, source, environment, date, verifications, unique_verifications, repeated_verifications, latest_verification_at)
    SELECT app_id, 'legacy', environment, day,
           SUM(verifications), SUM(uniques), SUM(repeats), MAX(latest)
    FROM grouped
    GROUP BY app_id, environment, day
    ON CONFLICT (app_id, source, environment, date) DO UPDATE SET
      verifications = t.verifications + EXCLUDED.verifications,
      unique_verifications = t.unique_verifications + EXCLUDED.unique_verifications,
      repeated_verifications = t.repeated_verifications + EXCLUDED.repeated_verifications,
      latest_verification_at = GREATEST(t.latest_verification_at, EXCLUDED.latest_verification_at),
      updated_at = now()
  ),
  up_app_total AS (
    INSERT INTO public.app_verification_stats_total AS t
      (app_id, source, environment, verifications, unique_verifications, repeated_verifications, latest_verification_at)
    SELECT app_id, 'legacy', environment,
           SUM(verifications), SUM(uniques), SUM(repeats), MAX(latest)
    FROM grouped
    GROUP BY app_id, environment
    ON CONFLICT (app_id, source, environment) DO UPDATE SET
      verifications = t.verifications + EXCLUDED.verifications,
      unique_verifications = t.unique_verifications + EXCLUDED.unique_verifications,
      repeated_verifications = t.repeated_verifications + EXCLUDED.repeated_verifications,
      latest_verification_at = GREATEST(t.latest_verification_at, EXCLUDED.latest_verification_at),
      updated_at = now()
  ),
  -- Old app_stats compatibility: identical semantics to the retired rollup_app_stats body
  -- (per-day actives via app_daily_users). Legacy-only, permanently.
  ins_daily_users AS (
    INSERT INTO public.app_daily_users (app_id, date, nullifier_hash)
    SELECT DISTINCT app_id, day, nullifier_hash
    FROM with_dims
    ON CONFLICT DO NOTHING
    RETURNING app_id, date
  ),
  new_users_per_day AS (
    SELECT app_id, date, COUNT(*)::bigint AS new_users
    FROM ins_daily_users
    GROUP BY app_id, date
  ),
  verifications_per_day AS (
    SELECT app_id, day AS date, SUM(delta)::bigint AS verifications
    FROM with_dims
    GROUP BY app_id, day
  ),
  up_app_stats AS (
    INSERT INTO public.app_stats (app_id, date, verifications, unique_users)
    SELECT v.app_id, v.date, v.verifications, COALESCE(u.new_users, 0)
    FROM verifications_per_day v
    LEFT JOIN new_users_per_day u ON u.app_id = v.app_id AND u.date = v.date
    ON CONFLICT (app_id, date) DO UPDATE SET
      verifications = public.app_stats.verifications + EXCLUDED.verifications,
      unique_users  = public.app_stats.unique_users  + EXCLUDED.unique_users
  ),
  advance_seen AS (
    INSERT INTO public.nullifier_uses_seen (nullifier_hash, last_seen_uses, last_seen_at)
    SELECT nullifier_hash, uses, _u
    FROM changed
    ON CONFLICT (nullifier_hash) DO UPDATE SET
      last_seen_uses = EXCLUDED.last_seen_uses,
      last_seen_at   = EXCLUDED.last_seen_at
  )
  SELECT COUNT(*) INTO _groups FROM grouped;

  UPDATE public.rollup_watermark
  SET last_until = _u,
      last_success_at = now()
  WHERE key = 'verification_stats';

  RETURN QUERY SELECT 'rollup'::text, 'applied'::text, _groups, 0::bigint, 0::bigint, NULL::text;
END;
$$;

CREATE OR REPLACE FUNCTION public.reconcile_verification_stats(_batch_size integer DEFAULT 500)
RETURNS SETOF public.verification_job_returning
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
  _cursor_action text;
  _boundary timestamptz;
  _last_id varchar(50);
  _checked bigint := 0;
  _repaired bigint := 0;
  _action_mismatch bigint := 0;
  _app_mismatch bigint := 0;
  _impossible bigint := 0;
  _done boolean := false;
BEGIN
  IF NOT pg_try_advisory_xact_lock(533214, 42) THEN
    RETURN QUERY SELECT 'reconciliation'::text, 'lock_not_acquired'::text, 0::bigint, 0::bigint, 0::bigint, NULL::text;
    RETURN;
  END IF;

  PERFORM set_config('statement_timeout', '60000', true);

  SELECT last_until - interval '15 minutes' INTO _boundary
  FROM public.rollup_watermark
  WHERE key = 'verification_stats';
  IF _boundary IS NULL THEN
    RETURN QUERY SELECT 'reconciliation'::text, 'skipped_no_watermark'::text, 0::bigint, 0::bigint, 0::bigint, NULL::text;
    RETURN;
  END IF;

  SELECT last_action_id INTO _cursor_action
  FROM public.verification_reconciliation_state
  WHERE id;

  CREATE TEMP TABLE _batch ON COMMIT DROP AS
  SELECT id
  FROM public.action
  WHERE _cursor_action IS NULL OR id > _cursor_action
  ORDER BY id
  LIMIT _batch_size;

  SELECT COUNT(*), MAX(id) INTO _checked, _last_id FROM _batch;
  _done := _checked < _batch_size;

  IF _checked > 0 THEN
    -- Repair pass: stranded positive deltas (behind the window the rollup will scan again).
    WITH stranded AS (
      SELECT n.nullifier_hash,
             n.action_id,
             n.updated_at,
             n.uses,
             (n.uses - COALESCE(s.last_seen_uses, 0))::bigint AS delta,
             (s.nullifier_hash IS NULL) AS is_new
      FROM public.nullifier n
      JOIN _batch b ON b.id = n.action_id
      LEFT JOIN public.nullifier_uses_seen s ON s.nullifier_hash = n.nullifier_hash
      WHERE n.uses > COALESCE(s.last_seen_uses, 0)
        AND n.updated_at < _boundary
    ),
    with_dims AS (
      SELECT st.nullifier_hash,
             st.action_id,
             st.updated_at,
             st.uses,
             st.delta,
             st.is_new,
             a.app_id,
             CASE WHEN app.is_staging THEN 'staging' ELSE 'production' END AS environment,
             (now() AT TIME ZONE 'UTC')::date AS day
      FROM stranded st
      JOIN public.action a ON a.id = st.action_id
      JOIN public.app ON app.id = a.app_id
    ),
    grouped AS (
      SELECT action_id,
             app_id,
             environment,
             day,
             SUM(delta)::bigint AS verifications,
             (COUNT(*) FILTER (WHERE is_new))::bigint AS uniques,
             SUM(CASE WHEN is_new THEN GREATEST(delta - 1, 0) ELSE delta END)::bigint AS repeats,
             MAX(updated_at) AS latest
      FROM with_dims
      GROUP BY action_id, app_id, environment, day
    ),
    up_action_daily AS (
      INSERT INTO public.action_verification_stats_daily AS t
        (action_id, app_id, source, environment, date, verifications, unique_verifications, repeated_verifications, latest_verification_at)
      SELECT action_id, app_id, 'legacy', environment, day, verifications, uniques, repeats, latest
      FROM grouped
      ON CONFLICT (action_id, source, environment, date) DO UPDATE SET
        verifications = t.verifications + EXCLUDED.verifications,
        unique_verifications = t.unique_verifications + EXCLUDED.unique_verifications,
        repeated_verifications = t.repeated_verifications + EXCLUDED.repeated_verifications,
        latest_verification_at = GREATEST(t.latest_verification_at, EXCLUDED.latest_verification_at),
        updated_at = now()
    ),
    up_action_total AS (
      INSERT INTO public.action_verification_stats_total AS t
        (action_id, app_id, source, environment, verifications, unique_verifications, repeated_verifications, latest_verification_at)
      SELECT action_id, app_id, 'legacy', environment,
             SUM(verifications), SUM(uniques), SUM(repeats), MAX(latest)
      FROM grouped
      GROUP BY action_id, app_id, environment
      ON CONFLICT (action_id, source, environment) DO UPDATE SET
        verifications = t.verifications + EXCLUDED.verifications,
        unique_verifications = t.unique_verifications + EXCLUDED.unique_verifications,
        repeated_verifications = t.repeated_verifications + EXCLUDED.repeated_verifications,
        latest_verification_at = GREATEST(t.latest_verification_at, EXCLUDED.latest_verification_at),
        updated_at = now()
    ),
    up_app_daily AS (
      INSERT INTO public.app_verification_stats_daily AS t
        (app_id, source, environment, date, verifications, unique_verifications, repeated_verifications, latest_verification_at)
      SELECT app_id, 'legacy', environment, day,
             SUM(verifications), SUM(uniques), SUM(repeats), MAX(latest)
      FROM grouped
      GROUP BY app_id, environment, day
      ON CONFLICT (app_id, source, environment, date) DO UPDATE SET
        verifications = t.verifications + EXCLUDED.verifications,
        unique_verifications = t.unique_verifications + EXCLUDED.unique_verifications,
        repeated_verifications = t.repeated_verifications + EXCLUDED.repeated_verifications,
        latest_verification_at = GREATEST(t.latest_verification_at, EXCLUDED.latest_verification_at),
        updated_at = now()
    ),
    up_app_total AS (
      INSERT INTO public.app_verification_stats_total AS t
        (app_id, source, environment, verifications, unique_verifications, repeated_verifications, latest_verification_at)
      SELECT app_id, 'legacy', environment,
             SUM(verifications), SUM(uniques), SUM(repeats), MAX(latest)
      FROM grouped
      GROUP BY app_id, environment
      ON CONFLICT (app_id, source, environment) DO UPDATE SET
        verifications = t.verifications + EXCLUDED.verifications,
        unique_verifications = t.unique_verifications + EXCLUDED.unique_verifications,
        repeated_verifications = t.repeated_verifications + EXCLUDED.repeated_verifications,
        latest_verification_at = GREATEST(t.latest_verification_at, EXCLUDED.latest_verification_at),
        updated_at = now()
    ),
    advance_seen AS (
      INSERT INTO public.nullifier_uses_seen (nullifier_hash, last_seen_uses, last_seen_at)
      SELECT nullifier_hash, uses, now()
      FROM stranded
      ON CONFLICT (nullifier_hash) DO UPDATE SET
        last_seen_uses = EXCLUDED.last_seen_uses,
        last_seen_at   = EXCLUDED.last_seen_at
    )
    SELECT COUNT(*) INTO _repaired FROM stranded;

    -- Structural checks (alert only, never auto-decrement).
    WITH expected_action AS (
      SELECT n.action_id,
             SUM(s.last_seen_uses)::bigint AS v,
             COUNT(*)::bigint AS u
      FROM public.nullifier n
      JOIN _batch b ON b.id = n.action_id
      JOIN public.nullifier_uses_seen s ON s.nullifier_hash = n.nullifier_hash
      GROUP BY n.action_id
    ),
    stored_action AS (
      SELECT t.action_id,
             SUM(t.verifications)::bigint AS v,
             SUM(t.unique_verifications)::bigint AS u
      FROM public.action_verification_stats_total t
      JOIN _batch b ON b.id = t.action_id
      WHERE t.source = 'legacy'
      GROUP BY t.action_id
    ),
    action_mismatch AS (
      SELECT COALESCE(e.action_id, st.action_id) AS action_id
      FROM expected_action e
      FULL JOIN stored_action st ON st.action_id = e.action_id
      WHERE COALESCE(e.v, 0) <> COALESCE(st.v, 0)
         OR COALESCE(e.u, 0) <> COALESCE(st.u, 0)
    ),
    batch_apps AS (
      SELECT DISTINCT a.app_id
      FROM public.action a
      JOIN _batch b ON b.id = a.id
    ),
    expected_app AS (
      SELECT t.app_id, t.source, t.environment,
             SUM(t.verifications)::bigint AS v,
             SUM(t.unique_verifications)::bigint AS u
      FROM public.action_verification_stats_total t
      JOIN batch_apps ba ON ba.app_id = t.app_id
      GROUP BY t.app_id, t.source, t.environment
    ),
    stored_app AS (
      SELECT s.app_id, s.source, s.environment,
             s.verifications AS v,
             s.unique_verifications AS u
      FROM public.app_verification_stats_total s
      JOIN batch_apps ba ON ba.app_id = s.app_id
    ),
    app_mismatch AS (
      SELECT COALESCE(e.app_id, st.app_id) AS app_id
      FROM expected_app e
      FULL JOIN stored_app st
        ON st.app_id = e.app_id AND st.source = e.source AND st.environment = e.environment
      WHERE COALESCE(e.v, 0) <> COALESCE(st.v, 0)
         OR COALESCE(e.u, 0) <> COALESCE(st.u, 0)
    ),
    impossible AS (
      SELECT n.nullifier_hash
      FROM public.nullifier n
      JOIN _batch b ON b.id = n.action_id
      JOIN public.nullifier_uses_seen s ON s.nullifier_hash = n.nullifier_hash
      WHERE n.uses < s.last_seen_uses
    )
    SELECT (SELECT COUNT(*) FROM action_mismatch),
           (SELECT COUNT(*) FROM app_mismatch),
           (SELECT COUNT(*) FROM impossible)
    INTO _action_mismatch, _app_mismatch, _impossible;
  END IF;

  IF _repaired > 0 THEN
    RAISE WARNING 'verification reconciliation recovered % stranded nullifier deltas (batch through %)',
      _repaired, _last_id;
  END IF;
  IF _action_mismatch > 0 OR _app_mismatch > 0 OR _impossible > 0 THEN
    RAISE WARNING 'verification reconciliation drift: action_total_mismatches=% app_total_mismatches=% impossible_snapshots=% (batch through %)',
      _action_mismatch, _app_mismatch, _impossible, _last_id;
  END IF;

  INSERT INTO public.verification_reconciliation_state (id, last_source, last_action_id, last_run_at)
  VALUES (true, 'legacy', CASE WHEN _done THEN NULL ELSE _last_id END, now())
  ON CONFLICT (id) DO UPDATE SET
    last_source = EXCLUDED.last_source,
    last_action_id = EXCLUDED.last_action_id,
    last_run_at = EXCLUDED.last_run_at;

  RETURN QUERY SELECT 'reconciliation'::text,
    (CASE WHEN _done THEN 'done' ELSE 'continue' END)::text,
    _checked,
    _repaired,
    (_action_mismatch + _app_mismatch + _impossible)::bigint,
    format('action_mismatch=%s,app_mismatch=%s,impossible=%s,last_action_id=%s',
           _action_mismatch, _app_mismatch, _impossible, COALESCE(_last_id, ''))::text;
END;
$$;
