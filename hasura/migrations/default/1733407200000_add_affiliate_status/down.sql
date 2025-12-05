-- Remove foreign key constraint from team table
ALTER TABLE "public"."team" DROP CONSTRAINT IF EXISTS "team_affiliate_status_fkey";

-- Remove affiliate_status column from team table
ALTER TABLE "public"."team" DROP COLUMN IF EXISTS "affiliate_status";

-- Delete affiliate_status enum values
DELETE FROM affiliate_status WHERE value IN ('none', 'pending', 'approved', 'rejected');

-- Drop affiliate_status enum table
DROP TABLE IF EXISTS affiliate_status;

