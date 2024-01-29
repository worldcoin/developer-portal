-- Updating this function to only restrict on unverified images so that we can refresh cache on verified
CREATE OR REPLACE FUNCTION validate_all_img_urls_format()
RETURNS TRIGGER AS $$
DECLARE
  item text;
BEGIN
  -- Only perform checks if verification_status is 'unverified'
  -- Currently converting all jpeg to jpg so that we can have a consistent format, perhaps we can allow jpeg too? 
  IF NEW.verification_status = 'unverified' THEN
    IF NEW.logo_img_url IS NOT NULL AND NEW.logo_img_url != '' THEN
      IF NEW.logo_img_url !~* '^(logo_img\.png|logo_img\.jpg)$' THEN
        RAISE EXCEPTION 'logo_img path must be either logo_img.png or logo_img.jpg';
      END IF;
    END IF;

    IF NEW.hero_image_url IS NOT NULL AND NEW.hero_image_url != '' THEN
      IF NEW.hero_image_url !~* '^(hero_image\.png|hero_image\.jpg)$' THEN
        RAISE EXCEPTION 'hero_image value must be either hero_image.png or hero_image.jpg';
      END IF;
    END IF;

    IF NEW.showcase_img_urls IS NOT NULL THEN
      IF array_length(NEW.showcase_img_urls, 1) > 3 THEN
        RAISE EXCEPTION 'showcase_img_urls can have a maximum of 3 images';
      END IF;

      FOREACH item IN ARRAY NEW.showcase_img_urls
      LOOP
        IF item !~* '^(showcase_img_[1-3]\.(png|jpg))$' THEN
          RAISE EXCEPTION 'Each item in showcase_img_urls must follow the pattern showcase_img_n.jpg where n is 1, 2, or 3';
        END IF;
      END LOOP;
    END IF;

  END IF; -- End of verification_status check

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "validate_img_uris" BEFORE INSERT
OR
UPDATE ON "public"."app_metadata" FOR EACH ROW EXECUTE FUNCTION validate_all_img_urls_format ();
