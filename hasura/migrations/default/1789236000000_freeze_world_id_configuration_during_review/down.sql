DROP TRIGGER IF EXISTS guard_active_app_review_redirect_write
ON public.redirect;

DROP TRIGGER IF EXISTS guard_active_app_review_action_v4_write
ON public.action_v4;

DROP TRIGGER IF EXISTS guard_active_app_review_rp_registration_write
ON public.rp_registration;

DROP TRIGGER IF EXISTS guard_active_app_review_action_write
ON public.action;

DROP FUNCTION IF EXISTS public.guard_active_app_review_action_v4_write();
DROP FUNCTION IF EXISTS public.guard_active_app_review_redirect_write();
DROP FUNCTION IF EXISTS public.guard_active_app_review_rp_registration_write();
DROP FUNCTION IF EXISTS public.guard_active_app_review_action_write();
DROP FUNCTION IF EXISTS public.guard_active_app_review_configuration(text, text);

DROP TRIGGER IF EXISTS guard_app_review_world_id_configuration_snapshot
ON public.app_review_submission;

DROP FUNCTION IF EXISTS public.guard_app_review_world_id_configuration_snapshot();

DROP TRIGGER IF EXISTS capture_app_review_world_id_configuration_snapshot
ON public.app_review_submission;

DROP FUNCTION IF EXISTS public.capture_app_review_world_id_configuration_snapshot();

ALTER TABLE public.app_review_submission
DROP CONSTRAINT IF EXISTS app_review_submission_world_id_configuration_snapshot_valid;

ALTER TABLE public.app_review_submission
DROP COLUMN IF EXISTS world_id_configuration_snapshot;

DROP FUNCTION IF EXISTS public.build_app_review_world_id_configuration_snapshot(text);

ALTER TABLE public.rp_registration
DROP CONSTRAINT IF EXISTS rp_registration_review_configuration_change_kind_valid;

ALTER TABLE public.rp_registration
DROP COLUMN IF EXISTS review_configuration_change_kind;
