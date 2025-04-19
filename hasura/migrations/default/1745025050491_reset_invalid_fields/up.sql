-- Step 1: Update validation function to support worldapp:// links
CREATE OR REPLACE FUNCTION validate_single_url(url text)
RETURNS void AS $$
BEGIN
  IF url IS NOT NULL AND url != '' THEN
    IF NOT (
      url ~* '^https://([[:alnum:]_-]+\.)+[[:alnum:]_-]+(/[[:alnum:]_\-./?%&=]*)?$'
      OR url ~* '^worldapp://[a-zA-Z0-9_-]+(/[a-zA-Z0-9_\-./?%&=]*)?$'
    ) THEN
      RAISE EXCEPTION USING ERRCODE='22000', MESSAGE='Invalid URL format. URLs must use HTTPS or worldapp.';
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Clean invalid URLs
UPDATE public.app_metadata
SET
  app_website_url = CASE
    WHEN app_website_url IS NOT NULL AND app_website_url != '' 
      AND NOT (app_website_url ~* '^https://([[:alnum:]_-]+\.)+[[:alnum:]_-]+(/[[:alnum:]_\-./?%&=]*)?$'
               OR app_website_url ~* '^worldapp://[a-zA-Z0-9_-]+(/[a-zA-Z0-9_\-./?%&=]*)?$')
    THEN ''
    ELSE app_website_url
  END,
  
  source_code_url = CASE
    WHEN source_code_url IS NOT NULL AND source_code_url != ''
      AND NOT (source_code_url ~* '^https://([[:alnum:]_-]+\.)+[[:alnum:]_-]+(/[[:alnum:]_\-./?%&=]*)?$'
               OR source_code_url ~* '^worldapp://[a-zA-Z0-9_-]+(/[a-zA-Z0-9_\-./?%&=]*)?$')
    THEN ''
    ELSE source_code_url
  END,

  integration_url = CASE
    WHEN integration_url IS NOT NULL AND integration_url != ''
      AND NOT (integration_url ~* '^https://([[:alnum:]_-]+\.)+[[:alnum:]_-]+(/[[:alnum:]_\-./?%&=]*)?$'
               OR integration_url ~* '^worldapp://[a-zA-Z0-9_-]+(/[a-zA-Z0-9_\-./?%&=]*)?$')
    THEN ''
    ELSE integration_url
  END;

-- Step 3: Clean invalid Image URLs
UPDATE public.app_metadata
SET
  logo_img_url = CASE
    WHEN logo_img_url IS NOT NULL AND logo_img_url != ''
      AND logo_img_url !~* '^([a-zA-Z0-9_-]+)\.(png|jpg)$'
    THEN ''
    ELSE logo_img_url
  END;
