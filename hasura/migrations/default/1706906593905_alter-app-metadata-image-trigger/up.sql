-- We check that we are using relative paths so that reviewers cannot misbehave and maliciously set urls
CREATE OR REPLACE FUNCTION validate_img_urls_relative_path()
RETURNS TRIGGER AS $$
DECLARE
  item text;
BEGIN
    IF NEW.logo_img_url IS NOT NULL AND NEW.logo_img_url != '' THEN
      IF NEW.logo_img_url !~* '^([a-zA-Z0-9_-]+)\.(png|jpg)$' THEN
        RAISE EXCEPTION 'logo_img path must be a relative path with alphanumeric characters, underscores, or hyphens, ending in .png or .jpg';
      END IF;
    END IF;

    IF NEW.hero_image_url IS NOT NULL AND NEW.hero_image_url != '' THEN
      IF NEW.hero_image_url !~* '^([a-zA-Z0-9_-]+)\.(png|jpg)$' THEN
        RAISE EXCEPTION 'hero_image path must be a relative path with alphanumeric characters, underscores, or hyphens, ending in .png or .jpg';
      END IF;
    END IF;

    IF NEW.showcase_img_urls IS NOT NULL THEN
      IF array_length(NEW.showcase_img_urls, 1) > 3 THEN
        RAISE EXCEPTION 'showcase_img_urls can have a maximum of 3 images';
      END IF;

      FOREACH item IN ARRAY NEW.showcase_img_urls
      LOOP
        IF item !~* '^([a-zA-Z0-9_-]+)\.(png|jpg)$' THEN
          RAISE EXCEPTION 'Each item in showcase_img_urls must be a relative path with alphanumeric characters, underscores, or hyphens, ending in .png or .jpg';
        END IF;
      END LOOP;
    END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "validate_img_is_relative_path" BEFORE INSERT
OR
UPDATE ON "public"."app_metadata" FOR EACH ROW EXECUTE FUNCTION validate_img_urls_relative_path ();
