alter table "public"."auth_code" rename column "verification_level" to "credential_type";
alter table "public"."nullifier" add column "credential_type" varchar;
alter table "public"."nullifier" alter column "credential_type" set default ''orb'::character varying';