ALTER TABLE public.invite
  ALTER COLUMN id SET DEFAULT gen_random_friendly_id('inv'::character varying);
