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

CREATE OR REPLACE FUNCTION public.reviewer_claim_app_review_notifications(
    p_worker_id text,
    p_limit integer
)
RETURNS SETOF public.app_review_notification
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
BEGIN
    IF btrim(COALESCE(p_worker_id, '')) = ''
       OR char_length(p_worker_id) > 128
       OR p_limit IS NULL
       OR p_limit < 1
       OR p_limit > 50 THEN
        RETURN;
    END IF;

    -- A crashed eighth delivery cannot be retried automatically without
    -- exceeding the configured cap. Preserve it as a visible dead letter.
    WITH exhausted_candidates AS (
        SELECT notification.id
        FROM public.app_review_notification AS notification
        WHERE notification.status = 'processing'
          AND (
              notification.locked_at IS NULL
              OR notification.locked_at <= now() - interval '5 minutes'
          )
          AND notification.attempt_count >= 8
        ORDER BY notification.locked_at, notification.id
        FOR UPDATE OF notification SKIP LOCKED
        LIMIT p_limit
    ), exhausted AS (
        UPDATE public.app_review_notification AS notification
        SET status = 'dead_letter',
            locked_at = NULL,
            locked_by = NULL,
            next_attempt_at = now(),
            last_error = COALESCE(
                notification.last_error,
                'Worker lease expired after the final delivery attempt.'
            )
        FROM exhausted_candidates
        WHERE notification.id = exhausted_candidates.id
        RETURNING notification.*
    )
    INSERT INTO public.app_review_event (
        submission_id,
        event_type,
        review_version,
        payload
    )
    SELECT
        exhausted.submission_id,
        'notification_dead_lettered',
        submission.review_version,
        jsonb_build_object(
            'notification_id', exhausted.id,
            'notification_type', exhausted.notification_type,
            'channel', exhausted.channel,
            'attempt_count', exhausted.attempt_count,
            'reason', 'worker_lease_expired'
        )
    FROM exhausted
    INNER JOIN public.app_review_submission AS submission
        ON submission.id = exhausted.submission_id;

    RETURN QUERY
    WITH candidates AS (
        SELECT notification.id
        FROM public.app_review_notification AS notification
        INNER JOIN public.app_review_submission AS submission
            ON submission.id = notification.submission_id
        WHERE (
                (
                    notification.status IN ('pending', 'failed')
                    AND notification.next_attempt_at <= now()
                )
                OR (
                    notification.status = 'processing'
                    AND (
                        notification.locked_at IS NULL
                        OR notification.locked_at <= now() - interval '5 minutes'
                    )
                )
            )
          AND notification.attempt_count < 8
          -- A Task 6 transport ambiguity is not evidence that prepared keys
          -- are unused. Leave the row unclaimed while the exact review lease
          -- is live; the worker can safely reconcile it once durable state is
          -- terminal, version-obsolete, withdrawn, or the unchanged lease ends.
          AND NOT (
              notification.notification_type = 'asset_cleanup'
              AND notification.payload ->> 'cleanup_kind' = 'prepared_operation_settlement'
              AND notification.payload ->> 'settlement_state' = 'pending'
              AND submission.status IN ('pending', 'in_review')
              AND notification.payload ->> 'expected_review_version' = submission.review_version::text
              AND submission.claim_expires_at > now()
          )
        ORDER BY
            CASE
                WHEN notification.notification_type = 'submission_received'
                 AND notification.channel = 'slack' THEN 0
                ELSE 1
            END,
            notification.next_attempt_at,
            notification.created_at,
            notification.id
        FOR UPDATE OF notification SKIP LOCKED
        LIMIT p_limit
    ), claimed AS (
        UPDATE public.app_review_notification AS notification
        SET status = 'processing',
            attempt_count = notification.attempt_count + 1,
            locked_at = now(),
            locked_by = p_worker_id,
            last_attempt_at = now(),
            delivered_at = NULL
        FROM candidates
        WHERE notification.id = candidates.id
        RETURNING notification.*
    ), attempted_events AS (
        INSERT INTO public.app_review_event (
            submission_id,
            event_type,
            review_version,
            payload
        )
        SELECT
            claimed.submission_id,
            'notification_attempted',
            submission.review_version,
            jsonb_build_object(
                'notification_id', claimed.id,
                'notification_type', claimed.notification_type,
                'channel', claimed.channel,
                'attempt_count', claimed.attempt_count,
                'worker_id', p_worker_id
            )
        FROM claimed
        INNER JOIN public.app_review_submission AS submission
            ON submission.id = claimed.submission_id
        RETURNING id
    ), publication_events AS (
        INSERT INTO public.app_review_event (
            submission_id,
            event_type,
            review_version,
            payload
        )
        SELECT
            claimed.submission_id,
            'publication_check_pending',
            submission.review_version,
            jsonb_build_object(
                'notification_id', claimed.id,
                'attempt_count', claimed.attempt_count
            )
        FROM claimed
        INNER JOIN public.app_review_submission AS submission
            ON submission.id = claimed.submission_id
        WHERE claimed.channel = 'publication'
        RETURNING id
    )
    SELECT claimed.*
    FROM claimed;
END;
$$;

CREATE OR REPLACE FUNCTION public.reviewer_complete_app_review_notification(
    p_notification_id uuid,
    p_worker_id text,
    p_outcome text,
    p_provider_message_id text,
    p_error text
)
RETURNS SETOF public.app_review_notification
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
DECLARE
    notification public.app_review_notification%ROWTYPE;
    submission public.app_review_submission%ROWTYPE;
    result_status text;
    result_event text;
    publication_event text;
    retry_seconds double precision;
BEGIN
    IF btrim(COALESCE(p_worker_id, '')) = ''
       OR char_length(p_worker_id) > 128
       OR p_outcome IS NULL
       OR p_outcome NOT IN ('delivered', 'failed', 'deferred')
       OR char_length(COALESCE(p_provider_message_id, '')) > 512
       OR char_length(COALESCE(p_error, '')) > 4000 THEN
        RETURN;
    END IF;

    SELECT candidate.*
    INTO notification
    FROM public.app_review_notification AS candidate
    WHERE candidate.id = p_notification_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    -- A provider can succeed while the first completion response is lost.
    -- Retrying the same delivered finalizer must observe the committed row
    -- instead of turning provider success into a failed/re-sent notification.
    IF notification.status = 'delivered'
       AND p_outcome = 'delivered'
       AND notification.provider_message_id IS NOT DISTINCT FROM
           NULLIF(btrim(COALESCE(p_provider_message_id, '')), '') THEN
        RETURN NEXT notification;
        RETURN;
    END IF;

    IF notification.status IS DISTINCT FROM 'processing'
       OR notification.locked_by IS DISTINCT FROM p_worker_id
       OR NOT (notification.locked_at > now() - interval '5 minutes') THEN
        RETURN;
    END IF;

    SELECT candidate.*
    INTO submission
    FROM public.app_review_submission AS candidate
    WHERE candidate.id = notification.submission_id;

    IF p_outcome = 'delivered' THEN
        result_status := 'delivered';
        result_event := 'notification_delivered';
        publication_event := 'publication_check_succeeded';

        UPDATE public.app_review_notification
        SET status = result_status,
            provider_message_id = NULLIF(btrim(COALESCE(p_provider_message_id, '')), ''),
            delivered_at = now(),
            last_error = NULL,
            locked_at = NULL,
            locked_by = NULL
        WHERE id = notification.id
        RETURNING * INTO notification;
    ELSIF p_outcome = 'deferred' THEN
        result_status := CASE
            WHEN notification.attempt_count >= 8 THEN 'dead_letter'
            ELSE 'failed'
        END;
        result_event := CASE
            WHEN notification.attempt_count >= 8 THEN 'notification_dead_lettered'
            ELSE 'notification_deferred'
        END;
        publication_event := 'publication_check_failed';
        retry_seconds := LEAST(
            3600::double precision,
            30::double precision * power(2, notification.attempt_count - 1)
        );

        UPDATE public.app_review_notification
        SET status = result_status,
            next_attempt_at = CASE
                WHEN result_status = 'dead_letter' THEN now()
                ELSE now() + make_interval(secs => retry_seconds)
            END,
            provider_message_id = NULL,
            delivered_at = NULL,
            last_error = COALESCE(NULLIF(btrim(COALESCE(p_error, '')), ''), 'Delivery deferred.'),
            locked_at = NULL,
            locked_by = NULL
        WHERE id = notification.id
        RETURNING * INTO notification;
    ELSE
        result_status := CASE
            WHEN notification.attempt_count >= 8 THEN 'dead_letter'
            ELSE 'failed'
        END;
        result_event := CASE
            WHEN notification.attempt_count >= 8 THEN 'notification_dead_lettered'
            ELSE 'notification_failed'
        END;
        publication_event := 'publication_check_failed';
        retry_seconds := LEAST(
            3600::double precision,
            30::double precision * power(2, notification.attempt_count - 1)
        );

        UPDATE public.app_review_notification
        SET status = result_status,
            next_attempt_at = CASE
                WHEN result_status = 'dead_letter' THEN now()
                ELSE now() + make_interval(secs => retry_seconds)
            END,
            provider_message_id = NULL,
            delivered_at = NULL,
            last_error = COALESCE(NULLIF(btrim(COALESCE(p_error, '')), ''), 'Delivery failed.'),
            locked_at = NULL,
            locked_by = NULL
        WHERE id = notification.id
        RETURNING * INTO notification;
    END IF;

    INSERT INTO public.app_review_event (
        submission_id,
        event_type,
        review_version,
        payload
    )
    VALUES (
        notification.submission_id,
        result_event,
        submission.review_version,
        jsonb_build_object(
            'notification_id', notification.id,
            'notification_type', notification.notification_type,
            'channel', notification.channel,
            'attempt_count', notification.attempt_count,
            'status', notification.status,
            'provider_message_id', notification.provider_message_id,
            'error', notification.last_error
        )
    );

    IF notification.channel = 'publication' THEN
        INSERT INTO public.app_review_event (
            submission_id,
            event_type,
            review_version,
            payload
        )
        VALUES (
            notification.submission_id,
            publication_event,
            submission.review_version,
            jsonb_build_object(
                'notification_id', notification.id,
                'attempt_count', notification.attempt_count,
                'status', notification.status,
                'error', notification.last_error
            )
        );
    END IF;

    RETURN NEXT notification;
END;
$$;

CREATE OR REPLACE FUNCTION public.reviewer_retry_app_review_notification(
    p_notification_id uuid,
    p_actor_subject text,
    p_actor_email text
)
RETURNS SETOF public.app_review_notification
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
DECLARE
    notification public.app_review_notification%ROWTYPE;
    submission public.app_review_submission%ROWTYPE;
    previous_status text;
    previous_error text;
BEGIN
    IF btrim(COALESCE(p_actor_subject, '')) = ''
       OR btrim(COALESCE(p_actor_email, '')) = '' THEN
        RETURN;
    END IF;

    SELECT candidate.*
    INTO notification
    FROM public.app_review_notification AS candidate
    WHERE candidate.id = p_notification_id
      AND candidate.status IN ('failed', 'dead_letter')
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    previous_status := notification.status;
    previous_error := notification.last_error;

    UPDATE public.app_review_notification
    SET status = 'pending',
        attempt_count = CASE
            WHEN previous_status = 'dead_letter' THEN 0
            ELSE notification.attempt_count
        END,
        next_attempt_at = now(),
        locked_at = NULL,
        locked_by = NULL,
        provider_message_id = NULL,
        delivered_at = NULL,
        last_error = NULL
    WHERE id = notification.id
    RETURNING * INTO notification;

    SELECT candidate.*
    INTO submission
    FROM public.app_review_submission AS candidate
    WHERE candidate.id = notification.submission_id;

    INSERT INTO public.app_review_event (
        submission_id,
        event_type,
        actor_subject,
        actor_email,
        review_version,
        payload
    )
    VALUES (
        notification.submission_id,
        'notification_retry_requested',
        p_actor_subject,
        p_actor_email,
        submission.review_version,
        jsonb_build_object(
            'notification_id', notification.id,
            'notification_type', notification.notification_type,
            'channel', notification.channel,
            'previous_status', previous_status,
            'previous_error', previous_error
        )
    );

    RETURN NEXT notification;
END;
$$;

COMMENT ON FUNCTION public.reviewer_claim_app_review_notifications(text, integer) IS
'Service-only SKIP LOCKED claim operation for the durable reviewer outbox.';
COMMENT ON FUNCTION public.reviewer_complete_app_review_notification(uuid, text, text, text, text) IS
'Service-only compare-and-set completion with retry/dead-letter audit events.';
COMMENT ON FUNCTION public.reviewer_retry_app_review_notification(uuid, text, text) IS
'Service-only manual retry operation attributed to an authenticated reviewer.';
