-- Could not auto-generate a down migration.
-- Please write an appropriate down migration for the SQL below:
-- alter table "public"."localisations" add column "showcase_img_urls" text[]
--  null;

ALTER TABLE localisations
DROP COLUMN showcase_img_urls;
