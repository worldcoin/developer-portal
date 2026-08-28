DROP TRIGGER IF EXISTS guard_reviewer_approval_integration_url
ON public.app_review_submission;

DROP FUNCTION IF EXISTS public.guard_reviewer_approval_integration_url();

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

ALTER FUNCTION public.capture_listing_review_submission_without_url_credentials_guard(
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

ALTER TABLE public.app_review_notification
DROP COLUMN manual_retry_blocked;

DROP FUNCTION IF EXISTS public.is_valid_reviewer_integration_url(text);
