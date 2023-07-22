alter table "public"."user" alter column "email" drop not null;
alter table "public"."user" alter column "email" set default null;
