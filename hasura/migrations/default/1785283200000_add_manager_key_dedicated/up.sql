ALTER TABLE public.rp_registration
  ADD COLUMN manager_key_dedicated boolean NOT NULL DEFAULT false;

UPDATE public.rp_registration
  SET manager_key_dedicated = true
  WHERE manager_kms_key_id IS NOT NULL;
