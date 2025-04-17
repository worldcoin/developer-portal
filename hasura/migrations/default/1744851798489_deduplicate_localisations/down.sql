-- Remove the unique constraint
ALTER TABLE public.localisations
DROP CONSTRAINT IF EXISTS unique_app_metadata_locale;