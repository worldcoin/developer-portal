-- remove notification state tracking columns
alter table "public"."app_metadata" 
drop constraint "app_metadata_notification_state_check";

alter table "public"."app_metadata" 
drop column "notification_state";

alter table "public"."app_metadata" 
drop column "notification_state_changed_date";
