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

CREATE OR REPLACE FUNCTION increment_app_stats(
  _nullifier_hash TEXT,
  _timestamp TIMESTAMPTZ,
  _action_id TEXT
)
RETURNS SETOF app_stats AS $$
DECLARE
  _app_id TEXT;
  _date DATE := date_trunc('day', _timestamp);
  _already_exists BOOLEAN;
BEGIN
  SELECT app_id INTO _app_id
  FROM action
  WHERE id = _action_id;

  IF _app_id IS NULL THEN
    RETURN;
  END IF;

  SELECT _nullifier_hash = ANY(nullifier_hashes)
  INTO _already_exists
  FROM app_stats
  WHERE app_id = _app_id AND date = _date;

  IF _already_exists THEN
    UPDATE app_stats
    SET verifications = verifications + 1
    WHERE app_id = _app_id AND date = _date;
  ELSE
    INSERT INTO app_stats (app_id, date, verifications, nullifier_hashes, unique_users)
    VALUES (_app_id, _date, 1, ARRAY[_nullifier_hash], 1)
    ON CONFLICT (app_id, date)
    DO UPDATE
    SET
      verifications = app_stats.verifications + 1,
      nullifier_hashes = (
        SELECT ARRAY(
          SELECT DISTINCT e FROM unnest(app_stats.nullifier_hashes || _nullifier_hash) e
        )
      ),
      unique_users = CARDINALITY(
        (SELECT ARRAY(
          SELECT DISTINCT e FROM unnest(app_stats.nullifier_hashes || _nullifier_hash) e
        ))
      );
  END IF;

  RETURN QUERY
  SELECT * FROM app_stats
  WHERE app_id = _app_id AND date = _date;
END;
$$ LANGUAGE plpgsql VOLATILE;