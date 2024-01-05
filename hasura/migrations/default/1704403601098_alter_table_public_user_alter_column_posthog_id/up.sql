ALTER TABLE "public"."user" ALTER COLUMN "posthog_id" drop default;
alter table "public"."user" alter column "posthog_id" drop not null;
