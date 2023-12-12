alter table "public"."auth_code" rename column "credential_type" to "verification_level";
alter table "public"."nullifier" drop column "credential_type" cascade;