
DROP INDEX IF EXISTS "public"."unique_app_id";

CREATE  INDEX "unique_verified_app_id" on
  "public"."app_metadata" using btree ("app_id");

DROP INDEX IF EXISTS "public"."app_metadata_id_locale";

DROP INDEX IF EXISTS "public"."team_id_foreign_key";