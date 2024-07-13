ALTER TABLE "public"."app_metadata" ALTER COLUMN "supported_languages" drop default;
ALTER TABLE "public"."app_metadata" ALTER COLUMN "supported_languages" TYPE ARRAY;
