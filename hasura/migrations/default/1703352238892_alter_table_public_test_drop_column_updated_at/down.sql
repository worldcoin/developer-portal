comment on column "public"."test"."updated_at" is E'test';
alter table "public"."test" alter column "updated_at" drop not null;
alter table "public"."test" add column "updated_at" timestamptz;
