DROP TRIGGER IF EXISTS guard_reviewer_approval_publishable_app
ON public.app_review_submission;

DROP FUNCTION IF EXISTS public.guard_reviewer_approval_publishable_app();

DROP TRIGGER IF EXISTS guard_active_app_review_publishable_state
ON public.app;

DROP FUNCTION IF EXISTS public.guard_active_app_review_publishable_state();

DROP FUNCTION public.capture_listing_review_submission(
    text,
    text,
    text,
    text,
    boolean,
    timestamptz,
    jsonb,
    jsonb
);

ALTER FUNCTION public.capture_listing_review_submission_without_publishable_app_guard(
    text,
    text,
    text,
    text,
    boolean,
    timestamptz,
    jsonb,
    jsonb
)
RENAME TO capture_listing_review_submission;
