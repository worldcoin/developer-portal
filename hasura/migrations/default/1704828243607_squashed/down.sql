alter table "public"."app" drop column if exists "category";

alter table "public"."app" drop column if exists "link";

alter table "public"."app" drop column if exists "is_developer_allow_app_store_listing";

alter table "public"."app" drop column if exists "is_reviewer_app_store_approve";

alter table "public"."app" drop column if exists "is_reviewer_world_app_approve";

alter table "public"."app" drop column if exists "world_app_description";

alter table "public"."app" drop column if exists "approved_by";