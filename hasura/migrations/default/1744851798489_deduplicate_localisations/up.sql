-- First, delete duplicate localizations, keeping only the latest one
WITH duplicates AS (
    SELECT 
        id,
        app_metadata_id,
        locale,
        updated_at,
        ROW_NUMBER() OVER (
            PARTITION BY app_metadata_id, locale 
            ORDER BY updated_at DESC
        ) as rn
    FROM public.localisations
)
DELETE FROM public.localisations
WHERE id IN (
    SELECT id 
    FROM duplicates 
    WHERE rn > 1
);

-- Add unique constraint to prevent future duplicates
ALTER TABLE public.localisations
ADD CONSTRAINT unique_app_metadata_locale 
UNIQUE (app_metadata_id, locale);
