-- Rollback: Drop rp_registration table and related types

-- Drop trigger first
DROP TRIGGER IF EXISTS "set_public_rp_registration_updated_at" ON "public"."rp_registration";

-- Drop table (this will also drop the foreign key constraint)
DROP TABLE IF EXISTS "public"."rp_registration";

-- Drop enum types
DROP TYPE IF EXISTS rp_registration_status;
DROP TYPE IF EXISTS rp_registration_mode;
