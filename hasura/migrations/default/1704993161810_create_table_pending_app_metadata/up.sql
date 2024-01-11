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
