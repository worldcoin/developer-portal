ALTER TABLE public.rp_registration
  ADD COLUMN is_unique_manager_key boolean NOT NULL DEFAULT false;

UPDATE public.rp_registration
  SET is_unique_manager_key = true
  WHERE manager_kms_key_id IS NOT NULL;
