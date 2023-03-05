
alter table "public"."app" add column "user_interfaces" jsonb NOT NULL default default '{}';

alter table "public"."action" drop column "status";

alter table "public"."action" drop column "kiosk_enabled";