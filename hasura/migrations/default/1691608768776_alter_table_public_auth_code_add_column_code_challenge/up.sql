alter table "public"."auth_code" add column "code_challenge" varchar null;
alter table "public"."auth_code" add column "code_challenge_method" varchar null;
