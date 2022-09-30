alter table "public"."app" drop column "created_at";
drop function "public"."set_current_timestamp_updated_at";
alter table "public"."app" drop column "updated_at";