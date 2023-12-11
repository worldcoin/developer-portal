alter table "public"."nullifier" drop constraint "credential_type_choices";

UPDATE public.nullifier
SET credential_type = 'device'
WHERE credential_type = 'phone';

alter table "public"."nullifier" add constraint "credential_type_choices" check (credential_type::text = ANY (ARRAY['orb'::text, 'device'::text]));
