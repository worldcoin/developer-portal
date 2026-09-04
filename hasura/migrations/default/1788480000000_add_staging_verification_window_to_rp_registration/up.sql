ALTER TABLE public.rp_registration
  ADD COLUMN staging_verification_expires_at timestamptz NULL;

COMMENT ON COLUMN public.rp_registration.staging_verification_expires_at IS
  'While this timestamp is in the future, /api/v4/verify accepts staging (and sandbox) proofs for this RP. NULL, or a timestamp in the past, means production proofs only.';
