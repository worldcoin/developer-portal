-- Update existing NULL values to false
UPDATE "public"."app"
SET
    "is_banned" = false
WHERE
    "is_banned" IS NULL;

-- Alter the column to set default to false and make it non-nullable
ALTER TABLE "public"."app"
ALTER COLUMN "is_banned"
SET DEFAULT false,
ALTER COLUMN "is_banned"
SET
    NOT NULL;