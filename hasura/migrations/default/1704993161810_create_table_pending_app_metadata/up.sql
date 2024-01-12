CREATE TABLE "public"."app_metadata" (
  "id" varchar NOT NULL UNIQUE DEFAULT gen_random_friendly_id('update'),
  "app_id" varchar NOT NULL,
  "name" varchar NOT NULL,
  "logo_img_url" varchar NULL,
  "showcase_img_urls" text[] NULL,
  "hero_image_url" varchar NULL,
  "description" text NOT NULL,
  "world_app_description" varchar NULL,
  "category" varchar NULL,
  "is_developer_allow_listing" bool NOT NULL DEFAULT false,
  "integration_url" varchar NULL,
  "app_website_url" varchar NULL,
  "source_code_url" varchar NULL,
  "verified_at" timestamptz NULL,
  "reviewed_by" varchar NULL,
  "is_reviewer_app_store_approved" bool NOT NULL DEFAULT false,
  "is_reviewer_world_app_approved" bool NOT NULL DEFAULT false,
  "review_message" text NULL,
  "status" varchar NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  primary key ("id")
);

CREATE OR REPLACE FUNCTION "public"."set_current_timestamp_updated_at"()
RETURNS TRIGGER AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "set_public_app_metadata_updated_at"
BEFORE UPDATE ON "public"."app_metadata"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_app_metadata_updated_at" ON "public"."app_metadata"
IS 'trigger to set value of column "updated_at" to current timestamp on row update';


alter table "public"."app_metadata"
  add constraint "app_metadata_app_id_fkey"
  foreign key ("app_id")
  references "public"."app"
  ("id") on update restrict on delete restrict;


CREATE OR REPLACE FUNCTION validate_single_url(url text)
RETURNS void as $$
BEGIN
  IF url IS NOT NULL AND url != '' THEN
    IF NOT (url ~* '^https://([[:alnum:]_-]+\.)+[[:alnum:]_-]+(/[[:alnum:]_\-./?%&=]*)?$') THEN
      RAISE EXCEPTION USING ERRCODE= '22000', MESSAGE= 'Invalid URL format. URLs must use HTTPS protocol.';
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION validate_metadata_urls()
RETURNS TRIGGER AS $$
DECLARE
  url text;
BEGIN
  -- Validate each URL field
  PERFORM validate_single_url(NEW.app_website_url);
  PERFORM validate_single_url(NEW.source_code_url);
  PERFORM validate_single_url(NEW.integration_url);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "validate_metadata_uris"
BEFORE INSERT OR UPDATE ON "public"."app_metadata"
FOR EACH ROW
EXECUTE FUNCTION validate_metadata_urls();

CREATE OR REPLACE FUNCTION validate_all_img_urls_format()
RETURNS TRIGGER AS $$
DECLARE
  item text;
BEGIN
  IF NEW.logo_img_url IS NOT NULL AND NEW.logo_img_url != '' THEN
    IF NEW.logo_img_url !~* '^(logo_img_url\.png|logo_img_url\.jpg)$' THEN
      RAISE EXCEPTION 'logo_img_url must be either logo_img_url.png or logo_img_url.jpg';
    END IF;
  END IF;

  IF NEW.hero_image_url IS NOT NULL AND NEW.hero_image_url != '' THEN
    IF NEW.hero_image_url !~* '^(hero_image_url\.png|hero_image_url\.jpg)$' THEN
      RAISE EXCEPTION 'hero_image_url must be either hero_image_url.png or hero_image_url.jpg';
    END IF;
  END IF;

  IF NEW.showcase_img_urls IS NOT NULL THEN
    IF array_length(NEW.showcase_img_urls, 1) > 3 THEN
      RAISE EXCEPTION 'showcase_img_urls can have a maximum of 3 images';
    END IF;

    FOREACH item IN ARRAY NEW.showcase_img_urls
    LOOP
      IF item !~* '^(showcase_img_urls_[1-3]\.(png|jpg))$' THEN
        RAISE EXCEPTION 'Each item in showcase_img_urls must follow the pattern showcase_img_urls_n.png or showcase_img_urls_n.jpg where n is 1, 2, or 3';
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "validate_img_uris"
BEFORE INSERT OR UPDATE ON "public"."app_metadata"
FOR EACH ROW
EXECUTE FUNCTION validate_all_img_urls_format();

CREATE UNIQUE INDEX "unique_verified_app_id" ON "public"."app_metadata" (app_id)
WHERE status = 'verified';

CREATE OR REPLACE FUNCTION "enforce_app_id_row_limit"()
RETURNS TRIGGER AS $$
DECLARE
  app_id_count integer;
BEGIN
  SELECT COUNT(*)
  INTO app_id_count
  FROM "public"."app_metadata"
  WHERE "app_id" = NEW."app_id";

  IF app_id_count >= 2 THEN
    RAISE EXCEPTION 'Each app_id can have at most two rows in the table.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "trigger_enforce_app_id_row_limit"
BEFORE INSERT OR UPDATE ON "public"."app_metadata"
FOR EACH ROW
EXECUTE FUNCTION enforce_app_id_row_limit();