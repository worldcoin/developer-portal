DROP TABLE "public"."redirect";
DROP TRIGGER IF EXISTS "set_public_redirect_updated_at" ON "public"."redirect";
DROP TRIGGER IF EXISTS "validate_redirect_uri_on_redirect" ON "public"."redirect";
DROP FUNCTION IF EXISTS "validate_url";