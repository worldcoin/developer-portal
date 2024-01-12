DROP TRIGGER IF EXISTS "set_public_memberships_updated_at" ON "public"."memberships";

DROP TABLE IF EXISTS "public"."memberships";

DELETE FROM role WHERE value IN ('OWNER', 'ADMIN', 'MEMBER');

DROP TABLE role;
