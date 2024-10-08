-- Remove the NOT NULL constraint
ALTER TABLE "public"."app"
ALTER COLUMN "is_banned"
DROP NOT NULL;

-- Remove the default value
ALTER TABLE "public"."app"
ALTER COLUMN "is_banned"
DROP DEFAULT;