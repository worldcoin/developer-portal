comment on column "public"."test"."is_online" is E'test';
alter table "public"."test" alter column "is_online" drop not null;
alter table "public"."test" add column "is_online" bool;
