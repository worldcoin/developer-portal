-- 1) Remove the old per-event function so nothing calls it accidentally
DROP FUNCTION IF EXISTS public.increment_app_stats(text, timestamptz, text);

-- 2) Simplify app_stats: drop array, make counters bigints (safe upcast)
ALTER TABLE public.app_stats
  DROP COLUMN IF EXISTS nullifier_hashes;

ALTER TABLE public.app_stats
  ALTER COLUMN verifications TYPE BIGINT USING verifications::BIGINT,
  ALTER COLUMN unique_users  TYPE BIGINT USING unique_users::BIGINT;

-- 2) Per-day unique-user dedupe table
CREATE TABLE IF NOT EXISTS public.app_daily_users (
  app_id         TEXT NOT NULL,
  date           DATE NOT NULL,
  nullifier_hash TEXT NOT NULL,
  PRIMARY KEY (app_id, date, nullifier_hash),
  FOREIGN KEY (app_id) REFERENCES public.app(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_app_daily_users_app_date
  ON public.app_daily_users (app_id, date);

-- 3) Last-seen snapshot per nullifier (so we apply only deltas)
CREATE TABLE IF NOT EXISTS public.nullifier_uses_seen (
  nullifier_hash  TEXT PRIMARY KEY,
  last_seen_uses  INTEGER NOT NULL,
  last_seen_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4) Helpful indexes for the rollup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_nullifier_action_id  ON public.nullifier (action_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_nullifier_updated_at ON public.nullifier (updated_at);

-- 5) Rollup function: attributes ALL deltas to day(updated_at)
CREATE OR REPLACE FUNCTION public.rollup_app_stats(
  _since TIMESTAMPTZ DEFAULT NULL,  -- inclusive
  _until TIMESTAMPTZ DEFAULT now()  -- exclusive
)
RETURNS SETOF public.app_stats
LANGUAGE plpgsql
VOLATILE
AS $$
BEGIN
  -- Prevent overlapping runs in the same DB
  IF NOT pg_try_advisory_xact_lock(533214, 42) THEN
    RAISE NOTICE 'rollup_app_stats is already running';
    RETURN;
  END IF;

  RETURN QUERY
  WITH candidates AS (
    SELECT
      n.nullifier_hash,
      n.action_id,
      n.updated_at,
      n.uses,
      s.last_seen_uses
    FROM public.nullifier n
    LEFT JOIN public.nullifier_uses_seen s
      ON s.nullifier_hash = n.nullifier_hash
    WHERE
      (_since IS NULL OR n.updated_at >= _since)
      AND n.updated_at < _until
  ),
  changed AS (
    SELECT
      c.nullifier_hash,
      c.action_id,
      c.updated_at,
      c.uses,
      (c.uses - COALESCE(c.last_seen_uses, 0))::BIGINT AS delta_uses
    FROM candidates c
    WHERE c.uses > COALESCE(c.last_seen_uses, 0)
  ),
  with_app AS (
    SELECT
      a.app_id,
      ((ch.updated_at AT TIME ZONE 'UTC')::DATE) AS date,
      ch.nullifier_hash,
      ch.delta_uses
    FROM changed ch
    JOIN public.action a ON a.id = ch.action_id
    WHERE a.app_id IS NOT NULL
  ),
  inserted_users AS (
    -- Count a user at most once per (app_id, date)
    INSERT INTO public.app_daily_users (app_id, date, nullifier_hash)
    SELECT DISTINCT app_id, date, nullifier_hash
    FROM with_app
    ON CONFLICT DO NOTHING
    RETURNING app_id, date
  ),
  new_users_per_day AS (
    SELECT app_id, date, COUNT(*)::BIGINT AS new_users
    FROM inserted_users
    GROUP BY app_id, date
  ),
  verifications_per_day AS (
    SELECT app_id, date, SUM(delta_uses)::BIGINT AS verifications
    FROM with_app
    GROUP BY app_id, date
  ),
  upsert_stats AS (
    INSERT INTO public.app_stats (app_id, date, verifications, unique_users)
    SELECT
      v.app_id,
      v.date,
      v.verifications,
      COALESCE(u.new_users, 0)
    FROM verifications_per_day v
    LEFT JOIN new_users_per_day u
      ON u.app_id = v.app_id AND u.date = v.date
    ON CONFLICT (app_id, date)
    DO UPDATE SET
      verifications = public.app_stats.verifications + EXCLUDED.verifications,
      unique_users  = public.app_stats.unique_users  + EXCLUDED.unique_users
    RETURNING public.app_stats.*
  ),
  advance_seen AS (
    -- Update snapshot only for hashes that changed in this window
    INSERT INTO public.nullifier_uses_seen (nullifier_hash, last_seen_uses, last_seen_at)
    SELECT ch.nullifier_hash, ch.uses, _until
    FROM changed ch
    ON CONFLICT (nullifier_hash) DO UPDATE
      SET last_seen_uses = EXCLUDED.last_seen_uses,
          last_seen_at   = EXCLUDED.last_seen_at
  )
  SELECT * FROM upsert_stats;
END;
$$;