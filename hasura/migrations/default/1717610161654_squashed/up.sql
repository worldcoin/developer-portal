
alter table "public"."app_metadata" add column "support_email" varchar
 null;

alter table "public"."app_metadata" add column "supported_countries" text[]
 null;

alter table "public"."app_metadata" add column "supported_languages" text[]
 null;
