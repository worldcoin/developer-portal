alter table "public"."app_metadata" add column "notification_permission_status" varchar;
alter table "public"."app_metadata" add column "notification_permission_status_changed_date" timestamptz;
alter table "public"."app_metadata" alter column "notification_permission_status" set default 'normal';
alter table "public"."app_metadata" alter column "notification_permission_status" drop not null;
alter table "public"."app_metadata" alter column "notification_permission_status_changed_date" drop not null;
