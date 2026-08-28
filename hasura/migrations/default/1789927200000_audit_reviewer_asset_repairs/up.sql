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
        'asset_snapshot_repair_attempted',
        'asset_snapshot_repair_succeeded',
        'asset_snapshot_repair_failed',
        'asset_snapshot_repair_dead_lettered',
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

CREATE FUNCTION public.reviewer_begin_app_review_asset_snapshot_repair(
    p_submission_id uuid,
    p_expected_review_version integer,
    p_expected_attempt_count integer,
    p_operation_id uuid
)
RETURNS SETOF public.app_review_submission
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
DECLARE
    observed_app_metadata_id text;
    current_metadata public.app_metadata%ROWTYPE;
    submission public.app_review_submission%ROWTYPE;
BEGIN
    IF p_submission_id IS NULL
       OR p_expected_review_version IS NULL
       OR p_expected_review_version <= 0
       OR p_expected_attempt_count IS NULL
       OR p_expected_attempt_count < 0
       OR p_operation_id IS NULL THEN
        RETURN;
    END IF;

    SELECT candidate.app_metadata_id
    INTO observed_app_metadata_id
    FROM public.app_review_submission AS candidate
    WHERE candidate.id = p_submission_id;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    PERFORM pg_advisory_xact_lock(
        hashtextextended(observed_app_metadata_id, 0)
    );

    SELECT metadata.*
    INTO current_metadata
    FROM public.app_metadata AS metadata
    WHERE metadata.id = observed_app_metadata_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    SELECT candidate.*
    INTO submission
    FROM public.app_review_submission AS candidate
    WHERE candidate.id = p_submission_id
    FOR UPDATE;

    IF NOT FOUND
       OR submission.app_metadata_id IS DISTINCT FROM observed_app_metadata_id
       OR submission.review_version IS DISTINCT FROM p_expected_review_version
       OR submission.asset_snapshot_repair_attempt_count IS DISTINCT FROM p_expected_attempt_count
       OR submission.status NOT IN ('pending', 'in_review')
       OR submission.asset_snapshot IS NOT NULL
       OR submission.asset_snapshot_repair_dead_lettered_at IS NOT NULL
       OR (
           submission.asset_snapshot_repair_next_at IS NOT NULL
           AND submission.asset_snapshot_repair_next_at > now()
       ) THEN
        RETURN;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.app_review_event AS event
        WHERE event.submission_id = submission.id
          AND event.event_type = 'asset_snapshot_repair_attempted'
          AND event.payload @> jsonb_build_object(
              'operation_id', p_operation_id
          )
    ) THEN
        RETURN NEXT submission;
        RETURN;
    END IF;

    INSERT INTO public.app_review_event (
        submission_id,
        event_type,
        actor_subject,
        review_version,
        payload
    )
    VALUES (
        submission.id,
        'asset_snapshot_repair_attempted',
        'system:asset-snapshot-repair',
        submission.review_version,
        jsonb_build_object(
            'operation_id', p_operation_id,
            'attempt_number', submission.asset_snapshot_repair_attempt_count + 1
        )
    );

    RETURN NEXT submission;
END;
$$;

CREATE FUNCTION public.audit_app_review_asset_snapshot_repair_outcome()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
BEGIN
    IF OLD.asset_snapshot IS NULL
       AND NEW.asset_snapshot IS NOT NULL
       AND EXISTS (
           SELECT 1
           FROM public.app_review_event AS attempted_event
           WHERE attempted_event.submission_id = NEW.id
             AND attempted_event.event_type = 'asset_snapshot_repair_attempted'
       ) THEN
        INSERT INTO public.app_review_event (
            submission_id,
            event_type,
            actor_subject,
            review_version,
            payload
        )
        VALUES (
            NEW.id,
            'asset_snapshot_repair_succeeded',
            'system:asset-snapshot-repair',
            NEW.review_version,
            jsonb_build_object(
                'attempt_number', OLD.asset_snapshot_repair_attempt_count + 1
            )
        );
    END IF;

    IF NEW.asset_snapshot_repair_attempt_count >
       OLD.asset_snapshot_repair_attempt_count THEN
        INSERT INTO public.app_review_event (
            submission_id,
            event_type,
            actor_subject,
            review_version,
            payload
        )
        VALUES (
            NEW.id,
            'asset_snapshot_repair_failed',
            'system:asset-snapshot-repair',
            NEW.review_version,
            jsonb_build_object(
                'attempt_number', NEW.asset_snapshot_repair_attempt_count,
                'error', NEW.asset_snapshot_repair_last_error,
                'next_attempt_at', NEW.asset_snapshot_repair_next_at
            )
        );

        IF OLD.asset_snapshot_repair_dead_lettered_at IS NULL
           AND NEW.asset_snapshot_repair_dead_lettered_at IS NOT NULL THEN
            INSERT INTO public.app_review_event (
                submission_id,
                event_type,
                actor_subject,
                review_version,
                payload
            )
            VALUES (
                NEW.id,
                'asset_snapshot_repair_dead_lettered',
                'system:asset-snapshot-repair',
                NEW.review_version,
                jsonb_build_object(
                    'attempt_number', NEW.asset_snapshot_repair_attempt_count,
                    'error', NEW.asset_snapshot_repair_last_error,
                    'dead_lettered_at', NEW.asset_snapshot_repair_dead_lettered_at
                )
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER audit_app_review_asset_snapshot_repair_outcome
AFTER UPDATE OF asset_snapshot,
    asset_snapshot_repair_attempt_count,
    asset_snapshot_repair_dead_lettered_at
ON public.app_review_submission
FOR EACH ROW
EXECUTE FUNCTION public.audit_app_review_asset_snapshot_repair_outcome();

COMMENT ON FUNCTION public.reviewer_begin_app_review_asset_snapshot_repair(uuid, integer, integer, uuid) IS
'Service-only idempotent audit marker written before an immutable review asset repair performs storage work.';

COMMENT ON FUNCTION public.audit_app_review_asset_snapshot_repair_outcome() IS
'Appends immutable success, failure, and dead-letter events for automatic review asset repairs.';
