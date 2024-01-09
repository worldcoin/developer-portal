alter table "public"."user" add column "posthog_id" varchar
 null unique default gen_random_friendly_id('posthog_id'::character varying);
