DROP TRIGGER IF EXISTS "trigger_set_upsert_constraint" ON "public"."app_metadata";

DROP FUNCTION IF EXISTS "set_upsert_constraint";

DROP TRIGGER IF EXISTS "trigger_enforce_app_id_row_limit" ON "public"."app_metadata";

DROP FUNCTION IF EXISTS "enforce_app_id_row_limit";

DROP INDEX IF EXISTS "unique_verified_app_id";

DROP FUNCTION IF EXISTS "validate_all_img_urls_format";

DROP TRIGGER IF EXISTS "validate_metadata_uris" ON "public"."app_metadata";

DROP FUNCTION IF EXISTS "validate_metadata_urls";

DROP FUNCTION IF EXISTS "validate_single_url";

DROP TRIGGER IF EXISTS "set_public_app_metadata_updated_at" ON "public"."app_metadata";

DROP TABLE "public"."app_metadata";