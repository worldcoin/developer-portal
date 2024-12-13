ALTER TABLE app_metadata
  ADD COLUMN changelog text;

UPDATE app_metadata
  SET changelog = '';

ALTER TABLE app_metadata
  ALTER COLUMN changelog SET NOT NULL;
