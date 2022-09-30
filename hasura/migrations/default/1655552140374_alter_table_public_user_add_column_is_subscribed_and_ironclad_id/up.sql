alter table "public"."user" add column "is_subscribed" boolean not null default 'false';
alter table "public"."user" add column "ironclad_id" varchar not null default '';