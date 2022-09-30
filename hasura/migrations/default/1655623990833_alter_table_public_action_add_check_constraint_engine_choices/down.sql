alter table "public"."action" drop constraint "engine_choices";
alter table "public"."action" add constraint "engine_choices" check (CHECK (engine = ANY (ARRAY['cloud'::text, 'blockchain'::text])));
