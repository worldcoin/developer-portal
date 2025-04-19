update "public"."app_metadata" set "is_android_only" = false;

alter table "public"."app_metadata" alter column "is_android_only" set default false;

alter table "public"."app_metadata" alter column "is_android_only" set not null;
