
DROP TABLE "public"."pending_app_metadata";
DROP TRIGGER IF EXISTS "set_public_pending_app_metadata_updated_at" ON "public"."pending_app_metadata";
DROP TRIGGER IF EXISTS "validate_metadata_uris" ON "public"."pending_app_metadata";
DROP FUNCTION IF EXISTS "validate_metadata_urls";
DROP FUNCTION IF EXISTS "validate_single_url";