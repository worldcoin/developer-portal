-- Could not auto-generate a down migration.
-- Please write an appropriate down migration for the SQL below:
-- alter table "public"."localisations" add column "hero_image_url" varchar
--  not null default ''::character varying;

ALTER TABLE localisations
DROP COLUMN hero_image_url;
