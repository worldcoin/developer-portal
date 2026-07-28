ALTER TABLE "public"."user"
DROP CONSTRAINT IF EXISTS "user_avatar_color_check";

ALTER TABLE "public"."user"
DROP COLUMN IF EXISTS "avatar_color";
