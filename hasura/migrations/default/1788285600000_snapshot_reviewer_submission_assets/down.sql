DROP TRIGGER guard_reviewer_approval_asset_snapshot
ON public.app_review_submission;
DROP FUNCTION public.guard_reviewer_approval_asset_snapshot();

DROP FUNCTION public.reviewer_set_app_review_asset_snapshot(uuid, integer, jsonb);

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

CREATE FUNCTION public.capture_listing_review_submission(
    p_app_metadata_id text,
    p_changelog text,
    p_submitted_by_subject text,
    p_submitted_by_email text,
    p_listing_consent boolean,
    p_expected_metadata_updated_at timestamptz,
    p_expected_localizations_snapshot jsonb
)
RETURNS SETOF public.app_review_submission
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
DECLARE
    previous_workflow_bypass text := current_setting('reviewer.workflow_bypass', true);
BEGIN
    PERFORM set_config('reviewer.workflow_bypass', 'on', true);
    BEGIN
        RETURN QUERY
        SELECT *
        FROM public.capture_listing_review_submission_without_reviewer_bypass(
            p_app_metadata_id,
            p_changelog,
            p_submitted_by_subject,
            p_submitted_by_email,
            p_listing_consent,
            p_expected_metadata_updated_at,
            p_expected_localizations_snapshot
        );
    EXCEPTION WHEN OTHERS THEN
        PERFORM set_config(
            'reviewer.workflow_bypass',
            COALESCE(previous_workflow_bypass, ''),
            true
        );
        RAISE;
    END;
    PERFORM set_config(
        'reviewer.workflow_bypass',
        COALESCE(previous_workflow_bypass, ''),
        true
    );
END;
$$;

DROP FUNCTION public.is_valid_reviewer_asset_snapshot(jsonb, text, text, jsonb);

ALTER TABLE public.app_review_submission
DROP CONSTRAINT app_review_submission_asset_snapshot_object,
DROP COLUMN asset_snapshot;
