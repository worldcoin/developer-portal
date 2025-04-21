UPDATE public.app_metadata
SET
  logo_img_url = CASE
    WHEN logo_img_url IS NOT NULL AND logo_img_url != ''
      AND logo_img_url !~* '^([a-zA-Z0-9_-]+)\.(png|jpg)$'
    THEN ''
    ELSE logo_img_url
  END,

  app_website_url = CASE
    WHEN app_website_url IS NOT NULL AND app_website_url != '' 
      AND NOT (app_website_url ~* '^https://([[:alnum:]_-]+\.)+[[:alnum:]_-]+(/[[:alnum:]_\-./?%&=]*)?$')
    THEN ''
    ELSE app_website_url
  END,

  source_code_url = CASE
    WHEN source_code_url IS NOT NULL AND source_code_url != ''
      AND NOT (source_code_url ~* '^https://([[:alnum:]_-]+\.)+[[:alnum:]_-]+(/[[:alnum:]_\-./?%&=]*)?$')
    THEN ''
    ELSE source_code_url
  END,

  integration_url = CASE
    WHEN integration_url IS NOT NULL AND integration_url != ''
      AND NOT (integration_url ~* '^https://([[:alnum:]_-]+\.)+[[:alnum:]_-]+(/[[:alnum:]_\-./?%&=]*)?$')
    THEN ''
    ELSE integration_url
  END;
