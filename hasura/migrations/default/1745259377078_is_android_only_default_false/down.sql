alter table "public"."app_metadata" alter column "is_android_only" drop not null;
alter table "public"."app_metadata" alter column "is_android_only" drop default;