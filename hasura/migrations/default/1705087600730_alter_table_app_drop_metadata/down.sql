
alter table "public"."app" alter column "verified_at" drop not null;
alter table "public"."app" add column "verified_at" timestamptz;

alter table "public"."app" alter column "logo_url" set default '''::text';
alter table "public"."app" alter column "logo_url" drop not null;
alter table "public"."app" add column "logo_url" text;

alter table "public"."app" alter column "description_internal" set default '''::text';
alter table "public"."app" alter column "description_internal" drop not null;
alter table "public"."app" add column "description_internal" text;

alter table "public"."app" alter column "name" drop not null;
alter table "public"."app" add column "name" varchar;