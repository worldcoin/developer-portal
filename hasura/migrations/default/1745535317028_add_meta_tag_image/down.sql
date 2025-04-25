-- Could not auto-generate a down migration.
-- Please write an appropriate down migration for the SQL below:
-- alter table "public"."app_metadata" add column "meta_tag_image_url" text default '';
-- alter table "public"."localisations" add column "meta_tag_image_url" text default '';
alter table "public"."app_metadata" drop column "meta_tag_image_url";
alter table "public"."localisations" drop column "meta_tag_image_url";