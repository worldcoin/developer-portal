-- Backfill empty category values with 'External' for apps that were created
-- before the default was changed from '' to 'External' in #1853.
UPDATE app_metadata
SET category = 'External'
WHERE category = '';

-- Update the column default so any future inserts that omit category
-- get 'External' instead of an empty string.
ALTER TABLE app_metadata
ALTER COLUMN category SET DEFAULT 'External';
