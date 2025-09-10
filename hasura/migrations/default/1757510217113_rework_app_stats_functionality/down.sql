-- Drop rollup + helper tables
DROP FUNCTION IF EXISTS public.rollup_app_stats(timestamptz, timestamptz);

DROP TABLE IF EXISTS public.nullifier_uses_seen;
DROP TABLE IF EXISTS public.app_daily_users;

-- Restore app_stats original layout (array + 32-bit ints)
ALTER TABLE public.app_stats
  ADD COLUMN IF NOT EXISTS nullifier_hashes TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE public.app_stats
  ALTER COLUMN verifications TYPE INTEGER USING verifications::INTEGER,
  ALTER COLUMN unique_users  TYPE INTEGER USING unique_users::INTEGER;

-- Recreate the original per-event function
CREATE OR REPLACE FUNCTION public.increment_app_stats(
  _nullifier_hash TEXT,
  _timestamp      TIMESTAMPTZ,
  _action_id      TEXT
)
RETURNS SETOF public.app_stats AS $$
DECLARE
  _app_id TEXT;
  _date   DATE := date_trunc('day', _timestamp);
  _already_exists BOOLEAN;
BEGIN
  SELECT app_id INTO _app_id
  FROM public.action
  WHERE id = _action_id;

  IF _app_id IS NULL THEN
    RETURN;
  END IF;

  SELECT _nullifier_hash = ANY(nullifier_hashes)
  INTO _already_exists
  FROM public.app_stats
  WHERE app_id = _app_id AND date = _date;

  IF _already_exists THEN
    UPDATE public.app_stats
    SET verifications = verifications + 1
    WHERE app_id = _app_id AND date = _date;
  ELSE
    INSERT INTO public.app_stats (app_id, date, verifications, nullifier_hashes, unique_users)
    VALUES (_app_id, _date, 1, ARRAY[_nullifier_hash], 1)
    ON CONFLICT (app_id, date)
    DO UPDATE
    SET
      verifications = public.app_stats.verifications + 1,
      nullifier_hashes = (
        SELECT ARRAY(
          SELECT DISTINCT e FROM unnest(public.app_stats.nullifier_hashes || _nullifier_hash) e
        )
      ),
      unique_users = CARDINALITY(
        (SELECT ARRAY(
          SELECT DISTINCT e FROM unnest(public.app_stats.nullifier_hashes || _nullifier_hash) e
        ))
      );
  END IF;

  RETURN QUERY
  SELECT * FROM public.app_stats
  WHERE app_id = _app_id AND date = _date;
END;
$$ LANGUAGE plpgsql VOLATILE;