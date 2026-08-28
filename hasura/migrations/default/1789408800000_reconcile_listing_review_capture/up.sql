CREATE FUNCTION public.reconcile_listing_review_submission_capture(
    p_app_metadata_id text,
    p_asset_snapshot jsonb
)
RETURNS SETOF public.app_review_submission
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
BEGIN
    IF p_app_metadata_id IS NULL
       OR p_app_metadata_id !~ '^[A-Za-z0-9_-]{1,200}$'
       OR p_asset_snapshot IS NULL
       OR jsonb_typeof(p_asset_snapshot) <> 'object' THEN
        RETURN;
    END IF;

    -- Capture, withdrawal, and resubmission use this same transaction-scoped
    -- lock. Waiting here turns a transport-ambiguous mutation into an ordered
    -- observation of its committed or aborted outcome before callers consider
    -- deleting the immutable S3 manifest.
    PERFORM pg_advisory_xact_lock(hashtextextended(p_app_metadata_id, 0));

    RETURN QUERY
    SELECT submission.*
    FROM public.app_review_submission AS submission
    WHERE submission.app_metadata_id = p_app_metadata_id
      AND submission.asset_snapshot = p_asset_snapshot
    ORDER BY submission.attempt DESC, submission.id DESC
    LIMIT 1;
END;
$$;

COMMENT ON FUNCTION public.reconcile_listing_review_submission_capture(text, jsonb) IS
'Waits behind listing capture and returns only the exact committed immutable asset manifest.';

CREATE FUNCTION public.reconcile_app_review_asset_snapshot_repair(
    p_submission_id uuid,
    p_asset_snapshot jsonb
)
RETURNS SETOF public.app_review_submission
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
DECLARE
    submission public.app_review_submission%ROWTYPE;
BEGIN
    IF p_submission_id IS NULL
       OR p_asset_snapshot IS NULL
       OR jsonb_typeof(p_asset_snapshot) <> 'object' THEN
        RETURN;
    END IF;

    -- The setter locks the submission and then its metadata row. Repeating that
    -- order waits for an in-flight setter before deciding whether its unique S3
    -- objects are referenced by a committed immutable manifest.
    SELECT candidate.*
    INTO submission
    FROM public.app_review_submission AS candidate
    WHERE candidate.id = p_submission_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    PERFORM metadata.id
    FROM public.app_metadata AS metadata
    WHERE metadata.id = submission.app_metadata_id
      AND metadata.app_id = submission.app_id
    FOR UPDATE;

    IF submission.asset_snapshot = p_asset_snapshot THEN
        RETURN NEXT submission;
    END IF;
END;
$$;

COMMENT ON FUNCTION public.reconcile_app_review_asset_snapshot_repair(uuid, jsonb) IS
'Waits behind asset snapshot repair and returns only its exact committed manifest.';
