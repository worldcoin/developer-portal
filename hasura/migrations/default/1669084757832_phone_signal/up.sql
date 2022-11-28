alter table "public"."action" add column "tmp_phone_signal_whitelist" boolean not null default 'false';

alter table "public"."nullifier" add column "nullifier_type" varchar not null default 'orb';

alter table "public"."nullifier" add constraint "nullifier_type_choices" check (nullifier_type = ANY (ARRAY['orb'::text, 'phone'::text]));

alter table "public"."nullifier" alter column "merkle_root" set default '';
