-- remove notification state tracking columns
alter table "public"."app_metadata" 
drop constraint "app_metadata_notification_permission_status_check";

alter table "public"."app_metadata" 
drop column "notification_permission_status";

alter table "public"."app_metadata" 
drop column "notification_permission_status_changed_date";
