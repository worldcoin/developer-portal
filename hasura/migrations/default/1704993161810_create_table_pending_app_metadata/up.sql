CREATE TABLE "public"."pending_app_metadata" (
  "id" varchar NOT NULL DEFAULT gen_random_friendly_id('update'),
  "name" varchar NOT NULL,
  "logo_img_url" text NOT NULL,
  "showcase_img_urls" jsonb NOT NULL,
  "hero_image_url" text NOT NULL,
  "description" text NOT NULL,
  "category" varchar NOT NULL,
  "publisher" varchar NOT NULL,
  "link_to_integration" varchar NOT NULL,
  "review_message" text NOT NULL,
  "review_status" varchar NOT NULL,
  "is_developer_allow_listing" bool NOT NULL,
  "world_app_description" varchar NOT NULL,
  "team_id" varchar NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "app_website" varchar NULL,
  "source_code_url" varchar NULL,
  "show_details_page" bool NOT NULL DEFAULT true,
  "app_id" varchar NOT NULL UNIQUE,
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
CREATE TRIGGER "set_public_pending_app_metadata_updated_at"
BEFORE UPDATE ON "public"."pending_app_metadata"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_pending_app_metadata_updated_at" ON "public"."pending_app_metadata"
IS 'trigger to set value of column "updated_at" to current timestamp on row update';

alter table "public"."pending_app_metadata"
  add constraint "pending_app_metadata_team_id_fkey"
  foreign key ("team_id")
  references "public"."team"
  ("id") on update restrict on delete restrict;


alter table "public"."pending_app_metadata"
  add constraint "pending_app_metadata_app_id_fkey"
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
  PERFORM validate_single_url(NEW.logo_img_url);
  PERFORM validate_single_url(NEW.hero_image_url);
  PERFORM validate_single_url(NEW.app_website);
  PERFORM validate_single_url(NEW.source_code_url);
  PERFORM validate_single_url(NEW.link_to_integration);
  FOR url IN SELECT jsonb_array_elements_text(NEW.showcase_img_urls)
  LOOP
    PERFORM public.validate_single_url(url);
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "validate_metadata_uris"
BEFORE INSERT OR UPDATE ON "public"."pending_app_metadata"
FOR EACH ROW
EXECUTE FUNCTION validate_metadata_urls();