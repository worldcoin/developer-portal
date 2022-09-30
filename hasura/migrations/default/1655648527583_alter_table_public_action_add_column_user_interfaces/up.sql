alter table "public"."action" add column "user_interfaces" jsonb not null default jsonb_build_object();
alter table "public"."action" add constraint "crypto_chain_choices" check (crypto_chain = ANY (ARRAY['polygon'::text, ''::text]));
