alter table "public"."action" add column "kiosk_enabled" boolean
 not null default 'false';


alter table "public"."action" add column "status" varchar
 not null default 'active';


alter table "public"."app" drop column "user_interfaces";