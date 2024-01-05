comment on column "public"."test"."created_at" is E'test';
alter table "public"."test" alter column "created_at" drop not null;
alter table "public"."test" add column "created_at" timestamptz;
