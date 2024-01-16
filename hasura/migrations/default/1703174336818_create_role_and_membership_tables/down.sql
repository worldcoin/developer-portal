DROP TRIGGER IF EXISTS "set_public_memberships_updated_at" ON "public"."membership";

DROP TABLE IF EXISTS "public"."membership";

DELETE FROM role WHERE value IN ('OWNER', 'ADMIN', 'MEMBER');

DROP TABLE role;
