alter table "public"."action" drop constraint "engine_choices";
alter table "public"."action" add constraint "engine_choices" check (engine = ANY (ARRAY['cloud'::text, 'on-chain'::text]));
