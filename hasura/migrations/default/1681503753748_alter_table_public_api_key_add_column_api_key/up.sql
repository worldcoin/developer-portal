


alter table "public"."api_key" add column "api_key" varchar not null default '';

alter table "public"."api_key" add column "name" text
 not null default ''::text;

alter table "public"."api_key" alter column "is_active" set default 'true';
