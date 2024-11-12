DROP INDEX IF EXISTS "public"."app_metadata_id_locale";

CREATE UNIQUE INDEX "app_metadata_id_locale" on "public"."localisations" using btree ("app_metadata_id", "locale");