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
