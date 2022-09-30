alter table "public"."action" add column "max_verifications_per_person" integer
 not null default '1';
