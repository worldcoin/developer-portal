alter table "public"."action" alter column "public_description" set default '';
alter table "public"."action" alter column "crypto_chain" set default '';
alter table "public"."action" alter column "return_url" set default '';
alter table "public"."action" add column "smart_contract_address" varchar not null default '';