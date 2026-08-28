DROP TRIGGER IF EXISTS guard_aborted_app_review_asset_cleanup_decision
ON public.app_review_submission;

DROP FUNCTION IF EXISTS public.guard_aborted_app_review_asset_cleanup_decision();

DROP FUNCTION IF EXISTS public.reviewer_reconcile_app_review_asset_cleanup(
    uuid,
    uuid,
    text,
    text,
    integer,
    text,
    jsonb,
    text
);
