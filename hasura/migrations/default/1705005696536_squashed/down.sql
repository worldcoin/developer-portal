DROP FUNCTION IF EXISTS "validate_app_urls_function";

DROP TRIGGER IF EXISTS "validate_app_urls" ON "public"."app";

alter table "public"."app"
drop column if exists "app_website";

alter table "public"."app"
drop column if exists "source_code_url";

alter table "public"."app"
drop column if exists "hero_image_url";

alter table "public"."app"
drop column if exists "showcase_img_urls";