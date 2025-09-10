alter table "public"."app_metadata" drop column "has_airdrop_component" cascade;
alter table "public"."app_metadata" drop column "dev_rewards_approved" cascade;
alter table "public"."app" add column "dev_rewards_approved" bool
 not null default 'false';
alter table "public"."app" add column "has_airdrop_component" bool
 not null default 'false';
