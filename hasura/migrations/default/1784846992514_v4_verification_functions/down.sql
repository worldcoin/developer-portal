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
  _source text;
  _cursor_action text;
  _boundary timestamptz;
  _last_id varchar(50);
  _checked bigint := 0;
  _stranded bigint := 0;
  _repaired_actions bigint := 0;
  _repaired_apps bigint := 0;
  _repaired_latest bigint := 0;
  _action_mismatch bigint := 0;
  _app_mismatch bigint := 0;
  _impossible bigint := 0;
  _exhausted boolean := false;
  _done boolean := false;
  _next_source text;
  _next_cursor text;
  _app_batch integer := LEAST(_batch_size, 100);
BEGIN
  -- Implementation law (plan section 12.3): every batch runs snapshot-consistent. The
  -- route invokes this through the repeatable-read Hasura source; direct calls must
  -- wrap in an explicit REPEATABLE READ transaction.
  IF current_setting('transaction_isolation') <> 'repeatable read' THEN
    RAISE EXCEPTION 'reconcile_verification_stats requires REPEATABLE READ isolation, got %',
      current_setting('transaction_isolation');
  END IF;

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

  SELECT COALESCE(last_source, 'legacy'), last_action_id
  INTO _source, _cursor_action
  FROM public.verification_reconciliation_state
  WHERE id;
  _source := COALESCE(_source, 'legacy');

  IF _source = 'legacy' THEN
    CREATE TEMP TABLE _batch ON COMMIT DROP AS
    SELECT id
    FROM public.action
    WHERE _cursor_action IS NULL OR id > _cursor_action
    ORDER BY id
    LIMIT _batch_size;

    SELECT COUNT(*), MAX(id) INTO _checked, _last_id FROM _batch;
    _exhausted := _checked < _batch_size;

    IF _checked > 0 THEN
      -- Repair pass 1: stranded positive deltas (behind the window the rollup will scan
      -- again). Flow-class repair: the delta is new consumption, so it lands on BOTH
      -- grains, exactly like the rollup.
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
      SELECT COUNT(*) INTO _stranded FROM stranded;

      -- Repair pass 2, ACTION GRAIN ONLY (plan section 6): stored action totals below the
      -- snapshot-consumed level are restored from canonical snapshot sums, including
      -- canonical latest_verification_at. Deliberately writes nothing at the app grain
      -- (the apps cursor leg owns app rows) and nothing at the daily grain (stock
      -- reconstruction repairs totals; dailies keep their own history — writing them
      -- would break the per-day app >= action balance the deletion trigger enforces).
      WITH canonical AS (
        SELECT n.action_id,
               SUM(s.last_seen_uses)::bigint AS v,
               COUNT(*)::bigint AS u,
               MAX(n.updated_at) AS latest
        FROM public.nullifier n
        JOIN _batch b ON b.id = n.action_id
        JOIN public.nullifier_uses_seen s ON s.nullifier_hash = n.nullifier_hash
        WHERE n.uses > 0
        GROUP BY n.action_id
      ),
      stored AS (
        SELECT t.action_id,
               SUM(t.verifications)::bigint AS v,
               SUM(t.unique_verifications)::bigint AS u
        FROM public.action_verification_stats_total t
        JOIN _batch b ON b.id = t.action_id
        WHERE t.source = 'legacy'
        GROUP BY t.action_id
      ),
      diffs AS (
        SELECT c.action_id,
               (c.v - COALESCE(st.v, 0))::bigint AS dv,
               (c.u - COALESCE(st.u, 0))::bigint AS du,
               c.latest
        FROM canonical c
        LEFT JOIN stored st ON st.action_id = c.action_id
        WHERE (c.v - COALESCE(st.v, 0)) >= 0
          AND (c.u - COALESCE(st.u, 0)) >= 0
          AND (c.v - COALESCE(st.v, 0)) >= (c.u - COALESCE(st.u, 0))
          AND ((c.v - COALESCE(st.v, 0)) > 0 OR (c.u - COALESCE(st.u, 0)) > 0)
      ),
      with_dims AS (
        SELECT d.action_id,
               d.dv,
               d.du,
               (d.dv - d.du)::bigint AS dr,
               d.latest,
               a.app_id,
               CASE WHEN app.is_staging THEN 'staging' ELSE 'production' END AS environment,
               (now() AT TIME ZONE 'UTC')::date AS day
        FROM diffs d
        JOIN public.action a ON a.id = d.action_id
        JOIN public.app ON app.id = a.app_id
      ),
      rep_action_total AS (
        INSERT INTO public.action_verification_stats_total AS t
          (action_id, app_id, source, environment, verifications, unique_verifications, repeated_verifications, latest_verification_at)
        SELECT action_id, app_id, 'legacy', environment, dv, du, dr, latest
        FROM with_dims
        ON CONFLICT (action_id, source, environment) DO UPDATE SET
          verifications = t.verifications + EXCLUDED.verifications,
          unique_verifications = t.unique_verifications + EXCLUDED.unique_verifications,
          repeated_verifications = t.repeated_verifications + EXCLUDED.repeated_verifications,
          latest_verification_at = GREATEST(t.latest_verification_at, EXCLUDED.latest_verification_at),
          updated_at = now()
      ),
      latest_rep AS (
        UPDATE public.action_verification_stats_total t
        SET latest_verification_at = c.latest,
            updated_at = now()
        FROM canonical c
        WHERE t.action_id = c.action_id
          AND t.source = 'legacy'
          AND c.latest IS NOT NULL
          AND (t.latest_verification_at IS NULL OR t.latest_verification_at < c.latest)
          AND c.action_id NOT IN (SELECT action_id FROM diffs)
        RETURNING t.action_id
      )
      SELECT (SELECT COUNT(*) FROM diffs),
             (SELECT COUNT(*) FROM latest_rep)
      INTO _repaired_actions, _repaired_latest;

      -- Structural checks, action grain (alert only, never auto-decrement).
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
      impossible AS (
        SELECT n.nullifier_hash
        FROM public.nullifier n
        JOIN _batch b ON b.id = n.action_id
        JOIN public.nullifier_uses_seen s ON s.nullifier_hash = n.nullifier_hash
        WHERE n.uses < s.last_seen_uses
      )
      SELECT (SELECT COUNT(*) FROM action_mismatch),
             (SELECT COUNT(*) FROM impossible)
      INTO _action_mismatch, _impossible;
    END IF;

    IF _exhausted THEN
      _next_source := 'apps';
      _next_cursor := NULL;
      _done := false;
    ELSE
      _next_source := 'legacy';
      _next_cursor := _last_id;
      _done := false;
    END IF;

  ELSE
    -- Apps leg: reconcile app rows against the sum of retained action rows, per
    -- (source, environment), in bounded app batches (per-app sums ride the app_id
    -- index on action_verification_stats_total). Positive drift tops the app row up
    -- (corrupt action rows keep alerting on the action legs each cycle and the app
    -- realigns the cycle after they are fixed); negative drift only alerts.
    CREATE TEMP TABLE _batch ON COMMIT DROP AS
    SELECT id
    FROM public.app
    WHERE _cursor_action IS NULL OR id > _cursor_action
    ORDER BY id
    LIMIT _app_batch;

    SELECT COUNT(*), MAX(id) INTO _checked, _last_id FROM _batch;
    _exhausted := _checked < _app_batch;

    IF _checked > 0 THEN
      WITH sums AS (
        SELECT t.app_id, t.source, t.environment,
               SUM(t.verifications)::bigint AS v,
               SUM(t.unique_verifications)::bigint AS u,
               MAX(t.latest_verification_at) AS latest
        FROM public.action_verification_stats_total t
        JOIN _batch b ON b.id = t.app_id
        GROUP BY t.app_id, t.source, t.environment
      ),
      stored AS (
        SELECT s.app_id, s.source, s.environment,
               s.verifications AS v,
               s.unique_verifications AS u,
               s.latest_verification_at AS latest
        FROM public.app_verification_stats_total s
        JOIN _batch b ON b.id = s.app_id
      ),
      pos AS (
        SELECT c.app_id, c.source, c.environment,
               (c.v - COALESCE(st.v, 0))::bigint AS dv,
               (c.u - COALESCE(st.u, 0))::bigint AS du,
               c.latest
        FROM sums c
        LEFT JOIN stored st
          ON st.app_id = c.app_id AND st.source = c.source AND st.environment = c.environment
        WHERE (c.v - COALESCE(st.v, 0)) >= 0
          AND (c.u - COALESCE(st.u, 0)) >= 0
          AND (c.v - COALESCE(st.v, 0)) >= (c.u - COALESCE(st.u, 0))
          AND ((c.v - COALESCE(st.v, 0)) > 0 OR (c.u - COALESCE(st.u, 0)) > 0)
      ),
      rep_total AS (
        INSERT INTO public.app_verification_stats_total AS t
          (app_id, source, environment, verifications, unique_verifications, repeated_verifications, latest_verification_at)
        SELECT app_id, source, environment, dv, du, (dv - du), latest
        FROM pos
        ON CONFLICT (app_id, source, environment) DO UPDATE SET
          verifications = t.verifications + EXCLUDED.verifications,
          unique_verifications = t.unique_verifications + EXCLUDED.unique_verifications,
          repeated_verifications = t.repeated_verifications + EXCLUDED.repeated_verifications,
          latest_verification_at = GREATEST(t.latest_verification_at, EXCLUDED.latest_verification_at),
          updated_at = now()
      ),
      latest_rep AS (
        UPDATE public.app_verification_stats_total t
        SET latest_verification_at = c.latest,
            updated_at = now()
        FROM sums c
        WHERE t.app_id = c.app_id
          AND t.source = c.source
          AND t.environment = c.environment
          AND c.latest IS NOT NULL
          AND (t.latest_verification_at IS NULL OR t.latest_verification_at < c.latest)
          AND NOT EXISTS (
            SELECT 1 FROM pos p
            WHERE p.app_id = c.app_id AND p.source = c.source AND p.environment = c.environment
          )
        RETURNING t.app_id
      ),
      neg AS (
        SELECT COALESCE(c.app_id, st.app_id) AS app_id
        FROM sums c
        FULL JOIN stored st
          ON st.app_id = c.app_id AND st.source = c.source AND st.environment = c.environment
        WHERE COALESCE(st.v, 0) > COALESCE(c.v, 0)
           OR COALESCE(st.u, 0) > COALESCE(c.u, 0)
      )
      SELECT (SELECT COUNT(*) FROM pos),
             (SELECT COUNT(*) FROM latest_rep),
             (SELECT COUNT(*) FROM neg)
      INTO _repaired_apps, _repaired_latest, _app_mismatch;
    END IF;

    IF _exhausted THEN
      _next_source := 'legacy';
      _next_cursor := NULL;
      _done := true;
    ELSE
      _next_source := 'apps';
      _next_cursor := _last_id;
      _done := false;
    END IF;
  END IF;

  IF _stranded > 0 OR _repaired_actions > 0 OR _repaired_apps > 0 OR _repaired_latest > 0 THEN
    RAISE WARNING 'verification reconciliation repaired: stranded_deltas=% missing_action_totals=% missing_app_totals=% latest_timestamps=% (source %, batch through %)',
      _stranded, _repaired_actions, _repaired_apps, _repaired_latest, _source, _last_id;
  END IF;
  IF _action_mismatch > 0 OR _app_mismatch > 0 OR _impossible > 0 THEN
    RAISE WARNING 'verification reconciliation drift: action_total_mismatches=% app_total_mismatches=% impossible_snapshots=% (source %, batch through %)',
      _action_mismatch, _app_mismatch, _impossible, _source, _last_id;
  END IF;

  INSERT INTO public.verification_reconciliation_state (id, last_source, last_action_id, last_run_at)
  VALUES (true, _next_source, _next_cursor, now())
  ON CONFLICT (id) DO UPDATE SET
    last_source = EXCLUDED.last_source,
    last_action_id = EXCLUDED.last_action_id,
    last_run_at = EXCLUDED.last_run_at;

  RETURN QUERY SELECT 'reconciliation'::text,
    (CASE WHEN _done THEN 'done' ELSE 'continue' END)::text,
    _checked,
    (_stranded + _repaired_actions + _repaired_apps)::bigint,
    (_action_mismatch + _app_mismatch + _impossible)::bigint,
    format('source=%s,stranded=%s,repaired_actions=%s,repaired_apps=%s,repaired_latest=%s,action_mismatch=%s,app_mismatch=%s,impossible=%s,last_action_id=%s',
           _source, _stranded, _repaired_actions, _repaired_apps, _repaired_latest,
           _action_mismatch, _app_mismatch, _impossible, COALESCE(_last_id, ''))::text;
END;
$$;
