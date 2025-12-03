-- Reverse the up migration by dropping the trigger and function
DROP TRIGGER IF EXISTS trigger_insert_app_create_default_action ON public.app;

DROP FUNCTION IF EXISTS public.create_default_action_for_app();
