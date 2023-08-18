alter table "public"."user" alter column "email" set default ''::character varying;
alter table "public"."user" alter column "email" set not null;
