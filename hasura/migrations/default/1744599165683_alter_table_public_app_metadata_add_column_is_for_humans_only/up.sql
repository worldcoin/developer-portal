alter table "public"."app_metadata" add column "is_for_humans_only" boolean
 not null default 'false';
