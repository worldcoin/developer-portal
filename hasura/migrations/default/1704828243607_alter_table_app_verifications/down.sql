alter table "public"."app" drop column if exists "category";

alter table "public"."app" drop column if exists "link_to_integration";

alter table "public"."app" drop column if exists "is_developer_allow_listing";

alter table "public"."app" drop column if exists "is_reviewer_app_store_approved";

alter table "public"."app" drop column if exists "is_reviewer_world_app_approved";

alter table "public"."app" drop column if exists "world_app_description";

alter table "public"."app" drop column if exists "approved_by";