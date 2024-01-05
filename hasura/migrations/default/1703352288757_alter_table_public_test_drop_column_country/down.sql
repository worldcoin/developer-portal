comment on column "public"."test"."country" is E'test';
alter table "public"."test" alter column "country" drop not null;
alter table "public"."test" add column "country" text;
