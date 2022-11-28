ALTER TABLE "public"."nullifier" ALTER COLUMN "merkle_root" drop default;

alter table "public"."nullifier" drop constraint "nullifier_type_choices";

alter table "public"."nullifier" drop column "nullifier_type";

alter table "public"."action" drop column "tmp_phone_signal_whitelist";