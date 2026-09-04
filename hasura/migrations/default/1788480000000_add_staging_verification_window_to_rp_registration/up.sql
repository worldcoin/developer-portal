ALTER TABLE public.rp_registration
  ADD COLUMN staging_verification_expires_at timestamptz NULL,
  ADD COLUMN staging_verification_token_hash text NULL;

COMMENT ON COLUMN public.rp_registration.staging_verification_expires_at IS
  'While this timestamp is in the future, /api/v4/verify may accept staging (and sandbox) proofs for this RP. NULL, or a timestamp in the past, means production proofs only.';

COMMENT ON COLUMN public.rp_registration.staging_verification_token_hash IS
  'HMAC of the one-time token issued when the staging window was opened. A staging verification must present the matching token; the plaintext is returned to the developer once and never stored.';
