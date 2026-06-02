ALTER TABLE "public"."rp_registration"
  ADD COLUMN "staging_status" rp_registration_status NULL,
  ADD COLUMN "staging_operation_hash" text NULL;
