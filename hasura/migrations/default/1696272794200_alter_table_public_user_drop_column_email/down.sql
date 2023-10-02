alter table "public"."user" add constraint "user_email_key" unique (email);
alter table "public"."user" alter column "email" drop not null;
alter table "public"."user" add column "email" varchar;
