alter table "public"."pending_app_metadata" add column "created_at" timestamptz
 null default now();
