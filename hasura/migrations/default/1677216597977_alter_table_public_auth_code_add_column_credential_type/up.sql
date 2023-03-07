alter table "public"."auth_code" add column "credential_type" varchar not null default '';
-- TODO: add choices constraint