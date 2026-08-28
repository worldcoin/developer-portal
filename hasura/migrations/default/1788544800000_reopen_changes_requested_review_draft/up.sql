ALTER TABLE public.app_review_event
DROP CONSTRAINT app_review_event_type_check;

ALTER TABLE public.app_review_event
ADD CONSTRAINT app_review_event_type_check
CHECK (
    event_type IN (
        'submitted',
        'claimed',
        'claim_heartbeat',
        'claim_released',
        'claim_expired',
        'checklist_updated',
        'changes_requested',
        'approved',
        'withdrawn',
        'draft_reopened',
        'notification_attempted',
        'notification_delivered',
        'notification_failed',
        'notification_dead_lettered',
        'notification_retry_requested',
        'notification_deferred',
        'publication_check_pending',
        'publication_check_succeeded',
        'publication_check_failed'
    )
);

CREATE FUNCTION public.reopen_changes_requested_review_draft(
    p_app_metadata_id text,
    p_expected_verification_status text,
    p_expected_metadata_updated_at timestamptz,
    p_actor_subject text,
    p_actor_email text
)
RETURNS SETOF public.app_metadata
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
DECLARE
    metadata public.app_metadata%ROWTYPE;
    reopened_metadata public.app_metadata%ROWTYPE;
    submission public.app_review_submission%ROWTYPE;
BEGIN
    IF p_expected_verification_status IS DISTINCT FROM 'changes_requested'
       OR p_expected_metadata_updated_at IS NULL
       OR btrim(COALESCE(p_actor_subject, '')) = '' THEN
        RETURN;
    END IF;

    PERFORM pg_advisory_xact_lock(hashtextextended(p_app_metadata_id, 0));

    SELECT candidate.*
    INTO metadata
    FROM public.app_metadata AS candidate
    WHERE candidate.id = p_app_metadata_id
    FOR UPDATE;

    IF NOT FOUND
       OR metadata.verification_status IS DISTINCT FROM p_expected_verification_status
       OR metadata.updated_at IS DISTINCT FROM p_expected_metadata_updated_at THEN
        RETURN;
    END IF;

    SELECT candidate.*
    INTO submission
    FROM public.app_review_submission AS candidate
    WHERE candidate.app_metadata_id = p_app_metadata_id
      AND candidate.status = 'changes_requested'
    ORDER BY candidate.attempt DESC
    LIMIT 1
    FOR UPDATE;

    UPDATE public.app_metadata
    SET verification_status = 'unverified'
    WHERE id = p_app_metadata_id
      AND verification_status = 'changes_requested'
      AND updated_at = p_expected_metadata_updated_at
    RETURNING * INTO reopened_metadata;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    IF submission.id IS NOT NULL THEN
        INSERT INTO public.app_review_event (
            submission_id,
            event_type,
            actor_subject,
            actor_email,
            review_version,
            payload
        )
        VALUES (
            submission.id,
            'draft_reopened',
            p_actor_subject,
            p_actor_email,
            submission.review_version,
            jsonb_build_object(
                'metadata_status_from', 'changes_requested',
                'metadata_status_to', 'unverified'
            )
        );
    END IF;

    RETURN NEXT reopened_metadata;
END;
$$;
