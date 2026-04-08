-- Revert the column default back to empty string.
ALTER TABLE app_metadata
ALTER COLUMN category SET DEFAULT '';

-- Note: we cannot revert the data backfill because we don't know
-- which rows originally had empty categories.
