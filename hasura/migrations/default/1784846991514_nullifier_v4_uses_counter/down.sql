DROP INDEX IF EXISTS "public"."nullifier_v4_action_v4_id_updated_at_idx";
DROP INDEX IF EXISTS "public"."nullifier_v4_updated_at_idx";
DROP TABLE IF EXISTS "public"."nullifier_v4_uses_seen";
DROP TRIGGER IF EXISTS "set_public_nullifier_v4_updated_at" ON "public"."nullifier_v4";
ALTER TABLE "public"."nullifier_v4" DROP COLUMN IF EXISTS "updated_at";
ALTER TABLE "public"."nullifier_v4" DROP COLUMN IF EXISTS "uses";
