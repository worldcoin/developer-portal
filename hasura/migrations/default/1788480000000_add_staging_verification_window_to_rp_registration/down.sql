ALTER TABLE public.rp_registration
  DROP COLUMN staging_verification_expires_at,
  DROP COLUMN staging_verification_token_hash;
