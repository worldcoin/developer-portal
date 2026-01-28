-- Rollback migration: Drop action_v4 and nullifier_v4 tables

-- Drop tables (nullifier_v4 first due to foreign key)
DROP TABLE IF EXISTS "public"."nullifier_v4";
DROP TABLE IF EXISTS "public"."action_v4";

-- Drop enum type
DROP TYPE IF EXISTS action_environment;
