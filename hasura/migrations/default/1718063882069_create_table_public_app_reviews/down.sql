DROP FUNCTION compute_average_rating (app_metadata_row app_metadata);

DROP TRIGGER IF EXISTS "set_public_app_reviews_updated_at" ON "public"."app_reviews";

DROP TABLE "public"."app_reviews";