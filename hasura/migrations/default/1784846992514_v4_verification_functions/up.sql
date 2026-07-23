-- PR 2: v4 branches for the verification analytics functions.
-- The v4 passes are gated on the 'v4_seed_completed_at' config marker so that a cron
-- tick landing between this migration and the v4 seed migration cannot double-count
-- recent v4 rows the seed is about to backfill (same pattern as PR 1's watermark gate).
-- Old app_stats NEVER receives v4 (plan section 12.8).

-- ---------------------------------------------------------------------------
-- 1) rollup_verification_stats: legacy pass unchanged; gated v4 pass appended.
-- Each pass is a single SQL statement, so reads and snapshot advances share one
-- MVCC snapshot per source. Both run under the same advisory lock + watermark window.
-- ---------------------------------------------------------------------------
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
  _groups_v4 bigint := 0;
  _v4_enabled boolean;
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

  -- v4 pass: gated until the v4 seed has established the clean delta boundary.
  _v4_enabled := EXISTS (
    SELECT 1 FROM public.verification_analytics_config WHERE key = 'v4_seed_completed_at'
  );

  IF _v4_enabled THEN
    WITH changed AS (
      SELECT n.id,
             n.action_v4_id,
             n.updated_at,
             n.uses,
             (n.uses - COALESCE(s.last_seen_uses, 0))::bigint AS delta,
             (s.nullifier_v4_id IS NULL) AS is_new
      FROM public.nullifier_v4 n
      LEFT JOIN public.nullifier_v4_uses_seen s ON s.nullifier_v4_id = n.id
      WHERE n.updated_at >= _start
        AND n.updated_at < _u
        AND n.uses > COALESCE(s.last_seen_uses, 0)
    ),
    with_dims AS (
      SELECT ch.id,
             ch.action_v4_id,
             ch.updated_at,
             ch.uses,
             ch.delta,
             ch.is_new,
             r.app_id,
             a.environment::text AS environment,
             (ch.updated_at AT TIME ZONE 'UTC')::date AS day
      FROM changed ch
      JOIN public.action_v4 a ON a.id = ch.action_v4_id
      JOIN public.rp_registration r ON r.rp_id = a.rp_id
    ),
    grouped AS (
      SELECT action_v4_id,
             app_id,
             environment,
             day,
             SUM(delta)::bigint AS verifications,
             (COUNT(*) FILTER (WHERE is_new))::bigint AS uniques,
             SUM(CASE WHEN is_new THEN GREATEST(delta - 1, 0) ELSE delta END)::bigint AS repeats,
             MAX(updated_at) AS latest
      FROM with_dims
      GROUP BY action_v4_id, app_id, environment, day
    ),
    up_action_daily AS (
      INSERT INTO public.action_verification_stats_daily AS t
        (action_id, app_id, source, environment, date, verifications, unique_verifications, repeated_verifications, latest_verification_at)
      SELECT action_v4_id, app_id, 'v4', environment, day, verifications, uniques, repeats, latest
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
      SELECT action_v4_id, app_id, 'v4', environment,
             SUM(verifications), SUM(uniques), SUM(repeats), MAX(latest)
      FROM grouped
      GROUP BY action_v4_id, app_id, environment
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
      SELECT app_id, 'v4', environment, day,
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
      SELECT app_id, 'v4', environment,
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
      INSERT INTO public.nullifier_v4_uses_seen (nullifier_v4_id, last_seen_uses, last_seen_at)
      SELECT id, uses, _u
      FROM changed
      ON CONFLICT (nullifier_v4_id) DO UPDATE SET
        last_seen_uses = EXCLUDED.last_seen_uses,
        last_seen_at   = EXCLUDED.last_seen_at
    )
    SELECT COUNT(*) INTO _groups_v4 FROM grouped;
  END IF;

  UPDATE public.rollup_watermark
  SET last_until = _u,
      last_success_at = now()
  WHERE key = 'verification_stats';

  RETURN QUERY SELECT 'rollup'::text, 'applied'::text, (_groups + _groups_v4)::bigint, 0::bigint, 0::bigint,
    format('legacy=%s,v4=%s', _groups, _groups_v4)::text;
END;
$$;

-- ---------------------------------------------------------------------------
-- 2) seed_v4_verification_stats: STRICTLY ONE-SHOT v4 backfill (plan section 5).
-- Runs at REPEATABLE READ under the advisory lock inside the seed migration.
-- Dailies are first-use rows at UTC(created_at); totals come from raw uses, which under
-- the guaranteed deploy order (migrations before the new handler) equals the plan's
-- (COUNT, COUNT, 0, MAX(created_at)) exactly — the old handler never incremented.
-- app_stats is untouched. 'v4_reuse_tracking_started_at' is NOT written here: it is set
-- manually only after the full API fleet runs the new handler.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.seed_v4_verification_stats()
RETURNS SETOF public.verification_job_returning
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
  _seed_until timestamptz := now();
  _seeded bigint := 0;
BEGIN
  IF current_setting('transaction_isolation') <> 'repeatable read' THEN
    RAISE EXCEPTION 'seed_v4_verification_stats requires REPEATABLE READ isolation, got %',
      current_setting('transaction_isolation');
  END IF;
  PERFORM pg_advisory_xact_lock(533214, 42);

  IF EXISTS (SELECT 1 FROM public.verification_analytics_config WHERE key = 'v4_seed_completed_at') THEN
    RETURN QUERY SELECT 'seed'::text, 'skipped_already_completed'::text, 0::bigint, 0::bigint, 0::bigint, 'v4'::text;
    RETURN;
  END IF;

  -- Honest first-use dailies at UTC(created_at), both grains.
  INSERT INTO public.action_verification_stats_daily
    (action_id, app_id, source, environment, date, verifications, unique_verifications, repeated_verifications, latest_verification_at)
  SELECT n.action_v4_id,
         r.app_id,
         'v4',
         a.environment::text,
         (n.created_at AT TIME ZONE 'UTC')::date,
         COUNT(*), COUNT(*), 0, MAX(n.created_at)
  FROM public.nullifier_v4 n
  JOIN public.action_v4 a ON a.id = n.action_v4_id
  JOIN public.rp_registration r ON r.rp_id = a.rp_id
  WHERE n.uses > 0
  GROUP BY n.action_v4_id, r.app_id, a.environment::text,
           (n.created_at AT TIME ZONE 'UTC')::date;

  INSERT INTO public.app_verification_stats_daily
    (app_id, source, environment, date, verifications, unique_verifications, repeated_verifications, latest_verification_at)
  SELECT r.app_id,
         'v4',
         a.environment::text,
         (n.created_at AT TIME ZONE 'UTC')::date,
         COUNT(*), COUNT(*), 0, MAX(n.created_at)
  FROM public.nullifier_v4 n
  JOIN public.action_v4 a ON a.id = n.action_v4_id
  JOIN public.rp_registration r ON r.rp_id = a.rp_id
  WHERE n.uses > 0
  GROUP BY r.app_id, a.environment::text,
           (n.created_at AT TIME ZONE 'UTC')::date;

  -- Lifetime totals from raw uses.
  INSERT INTO public.action_verification_stats_total
    (action_id, app_id, source, environment, verifications, unique_verifications, repeated_verifications, latest_verification_at)
  SELECT n.action_v4_id,
         r.app_id,
         'v4',
         a.environment::text,
         SUM(n.uses), COUNT(*), SUM(n.uses - 1), MAX(n.updated_at)
  FROM public.nullifier_v4 n
  JOIN public.action_v4 a ON a.id = n.action_v4_id
  JOIN public.rp_registration r ON r.rp_id = a.rp_id
  WHERE n.uses > 0
  GROUP BY n.action_v4_id, r.app_id, a.environment::text;

  INSERT INTO public.app_verification_stats_total
    (app_id, source, environment, verifications, unique_verifications, repeated_verifications, latest_verification_at)
  SELECT r.app_id,
         'v4',
         a.environment::text,
         SUM(n.uses), COUNT(*), SUM(n.uses - 1), MAX(n.updated_at)
  FROM public.nullifier_v4 n
  JOIN public.action_v4 a ON a.id = n.action_v4_id
  JOIN public.rp_registration r ON r.rp_id = a.rp_id
  WHERE n.uses > 0
  GROUP BY r.app_id, a.environment::text;

  -- Snapshots at current uses: the clean delta boundary that arms the v4 rollup pass.
  INSERT INTO public.nullifier_v4_uses_seen (nullifier_v4_id, last_seen_uses, last_seen_at)
  SELECT n.id, n.uses, _seed_until
  FROM public.nullifier_v4 n
  WHERE n.uses > 0;

  GET DIAGNOSTICS _seeded = ROW_COUNT;

  INSERT INTO public.verification_analytics_config (key, timestamp_value)
  VALUES ('v4_seed_completed_at', _seed_until);

  RETURN QUERY SELECT 'seed'::text, 'applied'::text, _seeded, 0::bigint, 0::bigint,
    format('v4,seed_until=%s', _seed_until)::text;
END;
$$;

-- ---------------------------------------------------------------------------
-- 3) reconcile_verification_stats: cursor now walks legacy actions, then v4 actions.
-- Each batch is single-source. When the v4 seed has not run, the cycle ends at the
-- legacy leg exactly as in PR 1. Old app_stats is deliberately NOT repaired here:
-- reconciliation recoveries feed only the new read models (approved ruling).
-- ---------------------------------------------------------------------------
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
  _repaired bigint := 0;
  _repaired_actions bigint := 0;
  _repaired_apps bigint := 0;
  _action_mismatch bigint := 0;
  _app_mismatch bigint := 0;
  _impossible bigint := 0;
  _exhausted boolean := false;
  _done boolean := false;
  _next_source text;
  _next_cursor text;
  _v4_enabled boolean;
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

  _v4_enabled := EXISTS (
    SELECT 1 FROM public.verification_analytics_config WHERE key = 'v4_seed_completed_at'
  );

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

      -- Positive-missing repair, action grain (plan section 6): stored totals below the
      -- snapshot-consumed level (e.g. lost/deleted rows) are restored from the canonical
      -- snapshot sums when the difference is componentwise nonnegative and
      -- invariant-preserving. The daily delta lands on the reconciliation-day row.
      WITH canonical AS (
        SELECT n.action_id,
               SUM(s.last_seen_uses)::bigint AS v,
               COUNT(*)::bigint AS u
        FROM public.nullifier n
        JOIN _batch b ON b.id = n.action_id
        JOIN public.nullifier_uses_seen s ON s.nullifier_hash = n.nullifier_hash
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
               (c.u - COALESCE(st.u, 0))::bigint AS du
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
               a.app_id,
               CASE WHEN app.is_staging THEN 'staging' ELSE 'production' END AS environment,
               (now() AT TIME ZONE 'UTC')::date AS day
        FROM diffs d
        JOIN public.action a ON a.id = d.action_id
        JOIN public.app ON app.id = a.app_id
      ),
      rep_action_total AS (
        INSERT INTO public.action_verification_stats_total AS t
          (action_id, app_id, source, environment, verifications, unique_verifications, repeated_verifications)
        SELECT action_id, app_id, 'legacy', environment, dv, du, dr
        FROM with_dims
        ON CONFLICT (action_id, source, environment) DO UPDATE SET
          verifications = t.verifications + EXCLUDED.verifications,
          unique_verifications = t.unique_verifications + EXCLUDED.unique_verifications,
          repeated_verifications = t.repeated_verifications + EXCLUDED.repeated_verifications,
          updated_at = now()
      ),
      rep_action_daily AS (
        INSERT INTO public.action_verification_stats_daily AS t
          (action_id, app_id, source, environment, date, verifications, unique_verifications, repeated_verifications)
        SELECT action_id, app_id, 'legacy', environment, day, dv, du, dr
        FROM with_dims
        ON CONFLICT (action_id, source, environment, date) DO UPDATE SET
          verifications = t.verifications + EXCLUDED.verifications,
          unique_verifications = t.unique_verifications + EXCLUDED.unique_verifications,
          repeated_verifications = t.repeated_verifications + EXCLUDED.repeated_verifications,
          updated_at = now()
      ),
      rep_app_total AS (
        INSERT INTO public.app_verification_stats_total AS t
          (app_id, source, environment, verifications, unique_verifications, repeated_verifications)
        SELECT app_id, 'legacy', environment, SUM(dv), SUM(du), SUM(dr)
        FROM with_dims
        GROUP BY app_id, environment
        ON CONFLICT (app_id, source, environment) DO UPDATE SET
          verifications = t.verifications + EXCLUDED.verifications,
          unique_verifications = t.unique_verifications + EXCLUDED.unique_verifications,
          repeated_verifications = t.repeated_verifications + EXCLUDED.repeated_verifications,
          updated_at = now()
      ),
      rep_app_daily AS (
        INSERT INTO public.app_verification_stats_daily AS t
          (app_id, source, environment, date, verifications, unique_verifications, repeated_verifications)
        SELECT app_id, 'legacy', environment, day, SUM(dv), SUM(du), SUM(dr)
        FROM with_dims
        GROUP BY app_id, environment, day
        ON CONFLICT (app_id, source, environment, date) DO UPDATE SET
          verifications = t.verifications + EXCLUDED.verifications,
          unique_verifications = t.unique_verifications + EXCLUDED.unique_verifications,
          repeated_verifications = t.repeated_verifications + EXCLUDED.repeated_verifications,
          updated_at = now()
      )
      SELECT COUNT(*) INTO _repaired_actions FROM diffs;

      -- Positive-missing repair, app grain: app rows below the sum of retained action
      -- totals (e.g. the app row itself was lost) are topped up per (source, environment).
      -- Guarded twice: the sum of stored action rows is only canonical when those rows
      -- match the snapshot sums (never propagate action-grain corruption upward), and only
      -- apps whose entire action set is inside this batch are eligible (a partial view
      -- cannot prove the app row short). Ineligible drift stays an alert.
      WITH batch_apps AS (
        SELECT DISTINCT a.app_id
        FROM public.action a
        JOIN _batch b ON b.id = a.id
      ),
      expected_action2 AS (
        SELECT n.action_id,
               SUM(s.last_seen_uses)::bigint AS v,
               COUNT(*)::bigint AS u
        FROM public.nullifier n
        JOIN _batch b ON b.id = n.action_id
        JOIN public.nullifier_uses_seen s ON s.nullifier_hash = n.nullifier_hash
        GROUP BY n.action_id
      ),
      stored_action2 AS (
        SELECT t.action_id,
               SUM(t.verifications)::bigint AS v,
               SUM(t.unique_verifications)::bigint AS u
        FROM public.action_verification_stats_total t
        JOIN _batch b ON b.id = t.action_id
        WHERE t.source = 'legacy'
        GROUP BY t.action_id
      ),
      inconsistent_apps AS (
        SELECT DISTINCT a.app_id
        FROM public.action a
        JOIN _batch b ON b.id = a.id
        LEFT JOIN expected_action2 e ON e.action_id = a.id
        LEFT JOIN stored_action2 st ON st.action_id = a.id
        WHERE COALESCE(e.v, 0) <> COALESCE(st.v, 0)
           OR COALESCE(e.u, 0) <> COALESCE(st.u, 0)
      ),
      eligible_apps AS (
        SELECT ba.app_id
        FROM batch_apps ba
        WHERE ba.app_id NOT IN (SELECT app_id FROM inconsistent_apps)
          AND NOT EXISTS (
            SELECT 1
            FROM public.action a2
            WHERE a2.app_id = ba.app_id
              AND a2.id NOT IN (SELECT id FROM _batch)
          )
      ),
      canonical_app AS (
        SELECT t.app_id, t.source, t.environment,
               SUM(t.verifications)::bigint AS v,
               SUM(t.unique_verifications)::bigint AS u
        FROM public.action_verification_stats_total t
        JOIN eligible_apps ba ON ba.app_id = t.app_id
        GROUP BY t.app_id, t.source, t.environment
      ),
      stored_app AS (
        SELECT s.app_id, s.source, s.environment,
               s.verifications AS v,
               s.unique_verifications AS u
        FROM public.app_verification_stats_total s
        JOIN batch_apps ba ON ba.app_id = s.app_id
      ),
      app_diffs AS (
        SELECT c.app_id, c.source, c.environment,
               (c.v - COALESCE(st.v, 0))::bigint AS dv,
               (c.u - COALESCE(st.u, 0))::bigint AS du
        FROM canonical_app c
        LEFT JOIN stored_app st
          ON st.app_id = c.app_id AND st.source = c.source AND st.environment = c.environment
        WHERE (c.v - COALESCE(st.v, 0)) >= 0
          AND (c.u - COALESCE(st.u, 0)) >= 0
          AND (c.v - COALESCE(st.v, 0)) >= (c.u - COALESCE(st.u, 0))
          AND ((c.v - COALESCE(st.v, 0)) > 0 OR (c.u - COALESCE(st.u, 0)) > 0)
      ),
      rep_app_total2 AS (
        INSERT INTO public.app_verification_stats_total AS t
          (app_id, source, environment, verifications, unique_verifications, repeated_verifications)
        SELECT app_id, source, environment, dv, du, (dv - du)
        FROM app_diffs
        ON CONFLICT (app_id, source, environment) DO UPDATE SET
          verifications = t.verifications + EXCLUDED.verifications,
          unique_verifications = t.unique_verifications + EXCLUDED.unique_verifications,
          repeated_verifications = t.repeated_verifications + EXCLUDED.repeated_verifications,
          updated_at = now()
      ),
      rep_app_daily2 AS (
        INSERT INTO public.app_verification_stats_daily AS t
          (app_id, source, environment, date, verifications, unique_verifications, repeated_verifications)
        SELECT app_id, source, environment, (now() AT TIME ZONE 'UTC')::date, dv, du, (dv - du)
        FROM app_diffs
        ON CONFLICT (app_id, source, environment, date) DO UPDATE SET
          verifications = t.verifications + EXCLUDED.verifications,
          unique_verifications = t.unique_verifications + EXCLUDED.unique_verifications,
          repeated_verifications = t.repeated_verifications + EXCLUDED.repeated_verifications,
          updated_at = now()
      )
      SELECT COUNT(*) INTO _repaired_apps FROM app_diffs;

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

    IF _exhausted THEN
      IF _v4_enabled THEN
        _next_source := 'v4';
        _next_cursor := NULL;
        _done := false;
      ELSE
        _next_source := 'legacy';
        _next_cursor := NULL;
        _done := true;
      END IF;
    ELSE
      _next_source := 'legacy';
      _next_cursor := _last_id;
      _done := false;
    END IF;

  ELSE
    -- v4 leg.
    IF NOT _v4_enabled THEN
      -- Defensive: cursor points at v4 but the seed marker is gone; close the cycle.
      _next_source := 'legacy';
      _next_cursor := NULL;
      _done := true;
    ELSE
      CREATE TEMP TABLE _batch ON COMMIT DROP AS
      SELECT id
      FROM public.action_v4
      WHERE _cursor_action IS NULL OR id > _cursor_action
      ORDER BY id
      LIMIT _batch_size;

      SELECT COUNT(*), MAX(id) INTO _checked, _last_id FROM _batch;
      _exhausted := _checked < _batch_size;

      IF _checked > 0 THEN
        WITH stranded AS (
          SELECT n.id AS nullifier_v4_id,
                 n.action_v4_id,
                 n.updated_at,
                 n.uses,
                 (n.uses - COALESCE(s.last_seen_uses, 0))::bigint AS delta,
                 (s.nullifier_v4_id IS NULL) AS is_new
          FROM public.nullifier_v4 n
          JOIN _batch b ON b.id = n.action_v4_id
          LEFT JOIN public.nullifier_v4_uses_seen s ON s.nullifier_v4_id = n.id
          WHERE n.uses > COALESCE(s.last_seen_uses, 0)
            AND n.updated_at < _boundary
        ),
        with_dims AS (
          SELECT st.nullifier_v4_id,
                 st.action_v4_id,
                 st.updated_at,
                 st.uses,
                 st.delta,
                 st.is_new,
                 r.app_id,
                 a.environment::text AS environment,
                 (now() AT TIME ZONE 'UTC')::date AS day
          FROM stranded st
          JOIN public.action_v4 a ON a.id = st.action_v4_id
          JOIN public.rp_registration r ON r.rp_id = a.rp_id
        ),
        grouped AS (
          SELECT action_v4_id,
                 app_id,
                 environment,
                 day,
                 SUM(delta)::bigint AS verifications,
                 (COUNT(*) FILTER (WHERE is_new))::bigint AS uniques,
                 SUM(CASE WHEN is_new THEN GREATEST(delta - 1, 0) ELSE delta END)::bigint AS repeats,
                 MAX(updated_at) AS latest
          FROM with_dims
          GROUP BY action_v4_id, app_id, environment, day
        ),
        up_action_daily AS (
          INSERT INTO public.action_verification_stats_daily AS t
            (action_id, app_id, source, environment, date, verifications, unique_verifications, repeated_verifications, latest_verification_at)
          SELECT action_v4_id, app_id, 'v4', environment, day, verifications, uniques, repeats, latest
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
          SELECT action_v4_id, app_id, 'v4', environment,
                 SUM(verifications), SUM(uniques), SUM(repeats), MAX(latest)
          FROM grouped
          GROUP BY action_v4_id, app_id, environment
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
          SELECT app_id, 'v4', environment, day,
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
          SELECT app_id, 'v4', environment,
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
          INSERT INTO public.nullifier_v4_uses_seen (nullifier_v4_id, last_seen_uses, last_seen_at)
          SELECT nullifier_v4_id, uses, now()
          FROM stranded
          ON CONFLICT (nullifier_v4_id) DO UPDATE SET
            last_seen_uses = EXCLUDED.last_seen_uses,
            last_seen_at   = EXCLUDED.last_seen_at
        )
        SELECT COUNT(*) INTO _repaired FROM stranded;

        -- Positive-missing repair, action grain (plan section 6), v4 source.
        WITH canonical AS (
          SELECT n.action_v4_id AS action_id,
                 SUM(s.last_seen_uses)::bigint AS v,
                 COUNT(*)::bigint AS u
          FROM public.nullifier_v4 n
          JOIN _batch b ON b.id = n.action_v4_id
          JOIN public.nullifier_v4_uses_seen s ON s.nullifier_v4_id = n.id
          GROUP BY n.action_v4_id
        ),
        stored AS (
          SELECT t.action_id,
                 SUM(t.verifications)::bigint AS v,
                 SUM(t.unique_verifications)::bigint AS u
          FROM public.action_verification_stats_total t
          JOIN _batch b ON b.id = t.action_id
          WHERE t.source = 'v4'
          GROUP BY t.action_id
        ),
        diffs AS (
          SELECT c.action_id,
                 (c.v - COALESCE(st.v, 0))::bigint AS dv,
                 (c.u - COALESCE(st.u, 0))::bigint AS du
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
                 r.app_id,
                 a.environment::text AS environment,
                 (now() AT TIME ZONE 'UTC')::date AS day
          FROM diffs d
          JOIN public.action_v4 a ON a.id = d.action_id
          JOIN public.rp_registration r ON r.rp_id = a.rp_id
        ),
        rep_action_total AS (
          INSERT INTO public.action_verification_stats_total AS t
            (action_id, app_id, source, environment, verifications, unique_verifications, repeated_verifications)
          SELECT action_id, app_id, 'v4', environment, dv, du, dr
          FROM with_dims
          ON CONFLICT (action_id, source, environment) DO UPDATE SET
            verifications = t.verifications + EXCLUDED.verifications,
            unique_verifications = t.unique_verifications + EXCLUDED.unique_verifications,
            repeated_verifications = t.repeated_verifications + EXCLUDED.repeated_verifications,
            updated_at = now()
        ),
        rep_action_daily AS (
          INSERT INTO public.action_verification_stats_daily AS t
            (action_id, app_id, source, environment, date, verifications, unique_verifications, repeated_verifications)
          SELECT action_id, app_id, 'v4', environment, day, dv, du, dr
          FROM with_dims
          ON CONFLICT (action_id, source, environment, date) DO UPDATE SET
            verifications = t.verifications + EXCLUDED.verifications,
            unique_verifications = t.unique_verifications + EXCLUDED.unique_verifications,
            repeated_verifications = t.repeated_verifications + EXCLUDED.repeated_verifications,
            updated_at = now()
        ),
        rep_app_total AS (
          INSERT INTO public.app_verification_stats_total AS t
            (app_id, source, environment, verifications, unique_verifications, repeated_verifications)
          SELECT app_id, 'v4', environment, SUM(dv), SUM(du), SUM(dr)
          FROM with_dims
          GROUP BY app_id, environment
          ON CONFLICT (app_id, source, environment) DO UPDATE SET
            verifications = t.verifications + EXCLUDED.verifications,
            unique_verifications = t.unique_verifications + EXCLUDED.unique_verifications,
            repeated_verifications = t.repeated_verifications + EXCLUDED.repeated_verifications,
            updated_at = now()
        ),
        rep_app_daily AS (
          INSERT INTO public.app_verification_stats_daily AS t
            (app_id, source, environment, date, verifications, unique_verifications, repeated_verifications)
          SELECT app_id, 'v4', environment, day, SUM(dv), SUM(du), SUM(dr)
          FROM with_dims
          GROUP BY app_id, environment, day
          ON CONFLICT (app_id, source, environment, date) DO UPDATE SET
            verifications = t.verifications + EXCLUDED.verifications,
            unique_verifications = t.unique_verifications + EXCLUDED.unique_verifications,
            repeated_verifications = t.repeated_verifications + EXCLUDED.repeated_verifications,
            updated_at = now()
        )
        SELECT COUNT(*) INTO _repaired_actions FROM diffs;

        -- Positive-missing repair, app grain, v4 source. Same guards as the legacy leg:
        -- only apps whose in-batch v4 actions match canonical and whose entire v4 action
        -- set is inside this batch are eligible; everything else stays an alert.
        WITH batch_apps AS (
          SELECT DISTINCT r.app_id
          FROM public.action_v4 a
          JOIN _batch b ON b.id = a.id
          JOIN public.rp_registration r ON r.rp_id = a.rp_id
        ),
        expected_action2 AS (
          SELECT n.action_v4_id AS action_id,
                 SUM(s.last_seen_uses)::bigint AS v,
                 COUNT(*)::bigint AS u
          FROM public.nullifier_v4 n
          JOIN _batch b ON b.id = n.action_v4_id
          JOIN public.nullifier_v4_uses_seen s ON s.nullifier_v4_id = n.id
          GROUP BY n.action_v4_id
        ),
        stored_action2 AS (
          SELECT t.action_id,
                 SUM(t.verifications)::bigint AS v,
                 SUM(t.unique_verifications)::bigint AS u
          FROM public.action_verification_stats_total t
          JOIN _batch b ON b.id = t.action_id
          WHERE t.source = 'v4'
          GROUP BY t.action_id
        ),
        inconsistent_apps AS (
          SELECT DISTINCT r.app_id
          FROM public.action_v4 a
          JOIN _batch b ON b.id = a.id
          JOIN public.rp_registration r ON r.rp_id = a.rp_id
          LEFT JOIN expected_action2 e ON e.action_id = a.id
          LEFT JOIN stored_action2 st ON st.action_id = a.id
          WHERE COALESCE(e.v, 0) <> COALESCE(st.v, 0)
             OR COALESCE(e.u, 0) <> COALESCE(st.u, 0)
        ),
        eligible_apps AS (
          SELECT ba.app_id
          FROM batch_apps ba
          WHERE ba.app_id NOT IN (SELECT app_id FROM inconsistent_apps)
            AND NOT EXISTS (
              SELECT 1
              FROM public.action_v4 a2
              JOIN public.rp_registration r2 ON r2.rp_id = a2.rp_id
              WHERE r2.app_id = ba.app_id
                AND a2.id NOT IN (SELECT id FROM _batch)
            )
        ),
        canonical_app AS (
          SELECT t.app_id, t.source, t.environment,
                 SUM(t.verifications)::bigint AS v,
                 SUM(t.unique_verifications)::bigint AS u
          FROM public.action_verification_stats_total t
          JOIN eligible_apps ba ON ba.app_id = t.app_id
          WHERE t.source = 'v4'
          GROUP BY t.app_id, t.source, t.environment
        ),
        stored_app AS (
          SELECT s.app_id, s.source, s.environment,
                 s.verifications AS v,
                 s.unique_verifications AS u
          FROM public.app_verification_stats_total s
          JOIN eligible_apps ba ON ba.app_id = s.app_id
          WHERE s.source = 'v4'
        ),
        app_diffs AS (
          SELECT c.app_id, c.source, c.environment,
                 (c.v - COALESCE(st.v, 0))::bigint AS dv,
                 (c.u - COALESCE(st.u, 0))::bigint AS du
          FROM canonical_app c
          LEFT JOIN stored_app st
            ON st.app_id = c.app_id AND st.source = c.source AND st.environment = c.environment
          WHERE (c.v - COALESCE(st.v, 0)) >= 0
            AND (c.u - COALESCE(st.u, 0)) >= 0
            AND (c.v - COALESCE(st.v, 0)) >= (c.u - COALESCE(st.u, 0))
            AND ((c.v - COALESCE(st.v, 0)) > 0 OR (c.u - COALESCE(st.u, 0)) > 0)
        ),
        rep_app_total2 AS (
          INSERT INTO public.app_verification_stats_total AS t
            (app_id, source, environment, verifications, unique_verifications, repeated_verifications)
          SELECT app_id, source, environment, dv, du, (dv - du)
          FROM app_diffs
          ON CONFLICT (app_id, source, environment) DO UPDATE SET
            verifications = t.verifications + EXCLUDED.verifications,
            unique_verifications = t.unique_verifications + EXCLUDED.unique_verifications,
            repeated_verifications = t.repeated_verifications + EXCLUDED.repeated_verifications,
            updated_at = now()
        ),
        rep_app_daily2 AS (
          INSERT INTO public.app_verification_stats_daily AS t
            (app_id, source, environment, date, verifications, unique_verifications, repeated_verifications)
          SELECT app_id, source, environment, (now() AT TIME ZONE 'UTC')::date, dv, du, (dv - du)
          FROM app_diffs
          ON CONFLICT (app_id, source, environment, date) DO UPDATE SET
            verifications = t.verifications + EXCLUDED.verifications,
            unique_verifications = t.unique_verifications + EXCLUDED.unique_verifications,
            repeated_verifications = t.repeated_verifications + EXCLUDED.repeated_verifications,
            updated_at = now()
        )
        SELECT COUNT(*) INTO _repaired_apps FROM app_diffs;

        WITH expected_action AS (
          SELECT n.action_v4_id AS action_id,
                 SUM(s.last_seen_uses)::bigint AS v,
                 COUNT(*)::bigint AS u
          FROM public.nullifier_v4 n
          JOIN _batch b ON b.id = n.action_v4_id
          JOIN public.nullifier_v4_uses_seen s ON s.nullifier_v4_id = n.id
          GROUP BY n.action_v4_id
        ),
        stored_action AS (
          SELECT t.action_id,
                 SUM(t.verifications)::bigint AS v,
                 SUM(t.unique_verifications)::bigint AS u
          FROM public.action_verification_stats_total t
          JOIN _batch b ON b.id = t.action_id
          WHERE t.source = 'v4'
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
          SELECT DISTINCT r.app_id
          FROM public.action_v4 a
          JOIN _batch b ON b.id = a.id
          JOIN public.rp_registration r ON r.rp_id = a.rp_id
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
          SELECT n.id
          FROM public.nullifier_v4 n
          JOIN _batch b ON b.id = n.action_v4_id
          JOIN public.nullifier_v4_uses_seen s ON s.nullifier_v4_id = n.id
          WHERE n.uses < s.last_seen_uses
        )
        SELECT (SELECT COUNT(*) FROM action_mismatch),
               (SELECT COUNT(*) FROM app_mismatch),
               (SELECT COUNT(*) FROM impossible)
        INTO _action_mismatch, _app_mismatch, _impossible;
      END IF;

      IF _exhausted THEN
        _next_source := 'legacy';
        _next_cursor := NULL;
        _done := true;
      ELSE
        _next_source := 'v4';
        _next_cursor := _last_id;
        _done := false;
      END IF;
    END IF;
  END IF;

  IF _repaired > 0 OR _repaired_actions > 0 OR _repaired_apps > 0 THEN
    RAISE WARNING 'verification reconciliation repaired: stranded_deltas=% missing_action_totals=% missing_app_totals=% (source %, batch through %)',
      _repaired, _repaired_actions, _repaired_apps, _source, _last_id;
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
    (_repaired + _repaired_actions + _repaired_apps)::bigint,
    (_action_mismatch + _app_mismatch + _impossible)::bigint,
    format('source=%s,stranded=%s,repaired_actions=%s,repaired_apps=%s,action_mismatch=%s,app_mismatch=%s,impossible=%s,last_action_id=%s',
           _source, _repaired, _repaired_actions, _repaired_apps,
           _action_mismatch, _app_mismatch, _impossible, COALESCE(_last_id, ''))::text;
END;
$$;
