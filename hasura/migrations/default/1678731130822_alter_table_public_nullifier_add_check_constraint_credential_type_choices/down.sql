alter table "public"."nullifier" drop constraint "credential_type_choices";
alter table "public"."nullifier" add constraint "verification_level_choices" check (CHECK (credential_type::text = ANY (ARRAY['orb'::text, 'phone'::text])));
