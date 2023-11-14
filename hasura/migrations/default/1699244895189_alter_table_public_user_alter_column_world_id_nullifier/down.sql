alter table "public"."user" alter column "world_id_nullifier" set not null;
ALTER TABLE "public"."user" ALTER COLUMN "world_id_nullifier" drop default;
