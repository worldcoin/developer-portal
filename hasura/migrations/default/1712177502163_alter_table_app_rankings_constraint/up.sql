ALTER TABLE public.app_rankings ADD CONSTRAINT app_rankings_platform_country_unique UNIQUE (platform, country);