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
        'asset_snapshot_repair_retry_requested',
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

CREATE FUNCTION public.reviewer_retry_app_review_asset_snapshot_repair(
    p_submission_id uuid,
    p_operation_id uuid,
    p_actor_subject text,
    p_actor_email text
)
RETURNS SETOF public.app_review_submission
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
DECLARE
    submission public.app_review_submission%ROWTYPE;
    previous_attempt_count integer;
    previous_error text;
BEGIN
    IF p_operation_id IS NULL
       OR btrim(COALESCE(p_actor_subject, '')) = ''
       OR btrim(COALESCE(p_actor_email, '')) = '' THEN
        RETURN;
    END IF;

    SELECT candidate.*
    INTO submission
    FROM public.app_review_submission AS candidate
    WHERE candidate.id = p_submission_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.app_review_event AS event
        WHERE event.submission_id = submission.id
          AND event.event_type = 'asset_snapshot_repair_retry_requested'
          AND event.actor_subject = p_actor_subject
          AND event.payload @> jsonb_build_object('operation_id', p_operation_id)
    ) THEN
        RETURN NEXT submission;
        RETURN;
    END IF;

    IF submission.status NOT IN ('pending', 'in_review')
       OR submission.asset_snapshot IS NOT NULL
       OR submission.asset_snapshot_repair_dead_lettered_at IS NULL THEN
        RETURN;
    END IF;

    previous_attempt_count := submission.asset_snapshot_repair_attempt_count;
    previous_error := submission.asset_snapshot_repair_last_error;

    UPDATE public.app_review_submission
    SET asset_snapshot_repair_attempt_count = 0,
        asset_snapshot_repair_next_at = now(),
        asset_snapshot_repair_last_error = NULL,
        asset_snapshot_repair_dead_lettered_at = NULL
    WHERE id = submission.id
      AND asset_snapshot IS NULL
      AND asset_snapshot_repair_dead_lettered_at IS NOT NULL
    RETURNING * INTO submission;

    IF NOT FOUND THEN
        RETURN;
    END IF;

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
        'asset_snapshot_repair_retry_requested',
        p_actor_subject,
        p_actor_email,
        submission.review_version,
        jsonb_build_object(
            'operation_id', p_operation_id,
            'previous_attempt_count', previous_attempt_count,
            'previous_error', previous_error
        )
    );

    RETURN NEXT submission;
END;
$$;

COMMENT ON FUNCTION public.reviewer_retry_app_review_asset_snapshot_repair(uuid, uuid, text, text) IS
'Idempotent reviewer-attributed requeue for a dead-lettered legacy asset snapshot repair.';
