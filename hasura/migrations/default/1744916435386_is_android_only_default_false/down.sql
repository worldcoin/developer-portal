-- Could not auto-generate a down migration.
-- Please write an appropriate down migration for the SQL below:
-- alter table "public"."app_metadata" alter column "is_android_only" set default false;
-- alter table "public"."app_metadata" alter column "is_android_only" set not null;
alter table "public"."app_metadata" alter column "is_android_only" drop not null;
alter table "public"."app_metadata" alter column "is_android_only" drop default;

