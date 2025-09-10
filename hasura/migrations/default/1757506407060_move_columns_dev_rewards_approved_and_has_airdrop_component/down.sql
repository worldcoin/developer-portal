alter table "public"."app_metadata" add column "dev_rewards_approved" Boolean
 not null default 'false';
alter table "public"."app_metadata" add column "has_airdrop_component" boolean
 not null default 'false';
alter table "public"."app" drop column "dev_rewards_approved";
alter table "public"."app" drop column "has_airdrop_component";
