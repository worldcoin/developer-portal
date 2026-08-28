DROP FUNCTION public.reviewer_decide_app_review_submission(
    uuid,
    uuid,
    integer,
    text,
    timestamptz,
    text,
    text,
    text,
    text,
    text,
    timestamptz,
    jsonb,
    jsonb,
    jsonb,
    jsonb,
    jsonb,
    jsonb,
    text,
    text
);

DROP FUNCTION public.reviewer_settle_app_review_asset_cleanup(
    uuid,
    text,
    text,
    text,
    text,
    text
);

DROP FUNCTION public.reviewer_enqueue_app_review_asset_cleanup(
    uuid,
    text,
    text,
    integer,
    text,
    jsonb,
    text,
    text
);

DROP TRIGGER guard_active_app_review_localization_write ON public.localisations;
DROP TRIGGER guard_active_app_review_metadata_write ON public.app_metadata;
DROP FUNCTION public.guard_active_app_review_localization_write();
DROP FUNCTION public.guard_active_app_review_metadata_write();

DROP FUNCTION public.withdraw_listing_review_submission(text, text, text);
ALTER FUNCTION public.withdraw_listing_review_submission_without_reviewer_bypass(
    text,
    text,
    text
) RENAME TO withdraw_listing_review_submission;

DROP FUNCTION public.capture_listing_review_submission(
    text,
    text,
    text,
    text,
    boolean,
    timestamptz,
    jsonb
);
ALTER FUNCTION public.capture_listing_review_submission_without_reviewer_bypass(
    text,
    text,
    text,
    text,
    boolean,
    timestamptz,
    jsonb
) RENAME TO capture_listing_review_submission;

-- Rolling Task 6 back abandons its pending asset settlement/cleanup work.
-- Remove those rows before restoring the narrower Task 2 domains.
DELETE FROM public.app_review_notification
WHERE notification_type = 'asset_cleanup'
   OR channel = 'asset';

ALTER TABLE public.app_review_notification
DROP CONSTRAINT app_review_notification_channel_check;

ALTER TABLE public.app_review_notification
ADD CONSTRAINT app_review_notification_channel_check
CHECK (channel IN ('slack', 'email', 'publication'));

ALTER TABLE public.app_review_notification
DROP CONSTRAINT app_review_notification_type_check;

ALTER TABLE public.app_review_notification
ADD CONSTRAINT app_review_notification_type_check
CHECK (
    notification_type IN (
        'submission_received',
        'decision_approved',
        'decision_changes_requested',
        'publication_check'
    )
);

ALTER TABLE public.app_review_submission
DROP CONSTRAINT app_review_submission_decision_result_object,
DROP COLUMN "decision_result",
DROP COLUMN "decision_fingerprint";
