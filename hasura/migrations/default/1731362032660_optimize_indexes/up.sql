CREATE INDEX "team_id_foreign_key" on "public"."app" using btree ("team_id");

CREATE UNIQUE INDEX "app_metadata_id_locale" on "public"."localisations" using btree ("app_metadata_id", "locale");

DROP INDEX IF EXISTS "public"."unique_verified_app_id";

CREATE INDEX "unique_app_id" on "public"."app_metadata" using btree ("app_id");