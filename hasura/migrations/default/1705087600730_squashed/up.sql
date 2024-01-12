
alter table "public"."app" drop column "name" cascade;

alter table "public"."app" drop column "description_internal" cascade;

alter table "public"."app" drop column "logo_url" cascade;

alter table "public"."app" drop column "verified_at" cascade;
