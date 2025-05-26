-- add notification state tracking columns
alter table "public"."app_metadata" 
add column "notification_state" varchar not null default 'normal';

alter table "public"."app_metadata" 
add column "notification_state_changed_date" timestamptz null;

-- add check constraint for valid states
alter table "public"."app_metadata" 
add constraint "app_metadata_notification_state_check" 
check ("notification_state" in ('normal', 'paused', 'enabled_after_pause'));
