alter table "public"."app" alter column "client_secret" drop not null;
alter table "public"."app" add column "client_secret" varchar;
