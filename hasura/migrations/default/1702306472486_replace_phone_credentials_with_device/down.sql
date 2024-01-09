alter table "public"."nullifier" drop constraint "credential_type_choices";

UPDATE public.nullifier
SET credential_type = 'phone'
WHERE credential_type = 'device';

alter table "public"."nullifier" add constraint "credential_type_choices" check (CHECK (credential_type::text = ANY (ARRAY['orb'::text, 'phone'::text])));