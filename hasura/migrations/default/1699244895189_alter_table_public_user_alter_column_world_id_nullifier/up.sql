alter table "public"."user" alter column "world_id_nullifier" drop not null;
alter table "public"."user" alter column "world_id_nullifier" set default null;