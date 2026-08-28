DROP FUNCTION public.reviewer_retry_app_review_notification(uuid, uuid, text, text);

CREATE FUNCTION public.reviewer_retry_app_review_notification(
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

COMMENT ON FUNCTION public.reviewer_retry_app_review_notification(uuid, text, text) IS
'Service-only manual retry operation attributed to an authenticated reviewer.';
