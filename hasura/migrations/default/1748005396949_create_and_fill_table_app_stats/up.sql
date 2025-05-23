-- Drop the old app_stats function and return type table if they exist
DROP FUNCTION IF EXISTS public.app_stats(varchar, timestamptz, varchar);
DROP TABLE IF EXISTS public.app_stats_returning;

-- Create app_stats table
CREATE TABLE IF NOT EXISTS app_stats (
  app_id TEXT NOT NULL,
  date DATE NOT NULL,
  verifications INTEGER NOT NULL DEFAULT 0,
  nullifier_hashes TEXT[] NOT NULL DEFAULT '{}',
  unique_users INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (app_id, date),
  FOREIGN KEY (app_id) REFERENCES app(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- Index for app_id lookups
CREATE INDEX IF NOT EXISTS idx_app_stats_app_id ON app_stats (app_id);

-- Backfill data
INSERT INTO app_stats (app_id, date, verifications, nullifier_hashes, unique_users)
SELECT
  a.app_id,
  date_trunc('day', n.created_at)::date AS date,
  COUNT(*) AS verifications,
  ARRAY_AGG(DISTINCT n.nullifier_hash) AS nullifier_hashes,
  COUNT(DISTINCT n.nullifier_hash) AS unique_users
FROM nullifier n
JOIN action a ON a.id = n.action_id
GROUP BY a.app_id, date_trunc('day', n.created_at)::date
ORDER BY a.app_id, date_trunc('day', n.created_at)::date;

-- Trigger function
CREATE OR REPLACE FUNCTION trg_update_app_stats()
RETURNS TRIGGER AS $$
DECLARE
  _app_id TEXT;
  _date DATE := date_trunc('day', NEW.created_at);
  _already_exists BOOLEAN;
BEGIN
  SELECT app_id INTO _app_id
  FROM action
  WHERE id = NEW.action_id;

  IF _app_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT NEW.nullifier_hash = ANY(nullifier_hashes)
  INTO _already_exists
  FROM app_stats
  WHERE app_id = _app_id AND date = _date;

  IF _already_exists THEN
    UPDATE app_stats
    SET verifications = verifications + 1
    WHERE app_id = _app_id AND date = _date;
  ELSE
    INSERT INTO app_stats (app_id, date, verifications, nullifier_hashes, unique_users)
    VALUES (_app_id, _date, 1, ARRAY[NEW.nullifier_hash], 1)
    ON CONFLICT (app_id, date)
    DO UPDATE
    SET verifications = app_stats.verifications + 1,
        nullifier_hashes = array_append(app_stats.nullifier_hashes, NEW.nullifier_hash),
        unique_users = app_stats.unique_users + 1;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger after insert on nullifier
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_after_nullifier_insert'
  ) THEN
    DROP TRIGGER trg_after_nullifier_insert ON nullifier;
  END IF;
END $$;

CREATE TRIGGER trg_after_nullifier_insert
AFTER INSERT ON nullifier
FOR EACH ROW
EXECUTE FUNCTION trg_update_app_stats();
