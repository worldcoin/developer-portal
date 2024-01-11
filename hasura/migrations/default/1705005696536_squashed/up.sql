alter table "public"."app"
add column "showcase_img_urls" jsonb null;

alter table "public"."app"
add column "hero_image_url" text null;

alter table "public"."app"
add column "source_code_url" varchar null;

alter table "public"."app"
add column "app_website" varchar null;

CREATE OR REPLACE FUNCTION validate_app_urls_function()
RETURNS TRIGGER AS $$
DECLARE
  url text;
BEGIN
  -- Validate each URL field
  PERFORM validate_single_url(NEW.app_website);
  PERFORM validate_single_url(NEW.source_code_url);
  PERFORM validate_single_url(NEW.link_to_integration);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "validate_app_urls"
BEFORE INSERT OR UPDATE ON "public"."app"
FOR EACH ROW
EXECUTE FUNCTION validate_app_urls_function();