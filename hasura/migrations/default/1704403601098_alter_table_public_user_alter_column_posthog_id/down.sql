alter table "public"."user" alter column "posthog_id" set not null;
alter table "public"."user" alter column "posthog_id" set default '""'::character varying;
