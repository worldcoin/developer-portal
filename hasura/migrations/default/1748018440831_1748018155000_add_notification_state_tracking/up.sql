-- add notification state tracking columns
alter table "public"."app_metadata" 
add column "notification_permission_status" varchar not null default 'normal';

alter table "public"."app_metadata" 
add column "notification_permission_status_changed_date" timestamptz null;

-- add check constraint for valid states
alter table "public"."app_metadata" 
add constraint "app_metadata_notification_permission_status_check" 
check ("notification_permission_status" in ('normal', 'paused', 'enabled_after_pause'));
