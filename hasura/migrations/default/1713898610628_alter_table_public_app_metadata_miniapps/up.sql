
alter table "public"."app_metadata" add column "whitelisted_addresses" text[]
 null;

alter table "public"."app_metadata" add column "app_mode" text
 not null default 'external';
