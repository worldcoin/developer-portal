alter table "public"."nullifier" drop constraint "verification_level_choices";
alter table "public"."nullifier" add constraint "credential_type_choices" check (credential_type::text = ANY (ARRAY['orb'::text, 'phone'::text]));
