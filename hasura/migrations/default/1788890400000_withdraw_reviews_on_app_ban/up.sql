CREATE FUNCTION public.withdraw_active_app_reviews_for_ban(
    p_app_id text,
    p_actor_subject text,
    p_reason text,
    p_occurred_at timestamptz
)
RETURNS void
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
DECLARE
    withdrawn_submission public.app_review_submission%ROWTYPE;
    cancelled_notification record;
BEGIN
    IF p_app_id IS NULL
       OR btrim(COALESCE(p_actor_subject, '')) = ''
       OR p_reason NOT IN ('app_banned', 'rollout_banned_app') THEN
        RETURN;
    END IF;

    FOR withdrawn_submission IN
        UPDATE public.app_review_submission
        SET status = 'withdrawn',
            review_version = review_version + 1,
            claim_token = NULL,
            claimed_by_subject = NULL,
            claimed_by_email = NULL,
            claimed_at = NULL,
            claim_expires_at = NULL,
            completed_at = COALESCE(p_occurred_at, now())
        WHERE app_id = p_app_id
          AND status IN ('pending', 'in_review')
        RETURNING *
    LOOP
        UPDATE public.app_metadata
        SET verification_status = 'unverified'
        WHERE id = withdrawn_submission.app_metadata_id
          AND verification_status = 'awaiting_review';

        INSERT INTO public.app_review_event (
            submission_id,
            event_type,
            actor_subject,
            actor_email,
            review_version,
            payload
        )
        VALUES (
            withdrawn_submission.id,
            'withdrawn',
            p_actor_subject,
            NULL,
            withdrawn_submission.review_version,
            jsonb_build_object(
                'reason', p_reason,
                'occurred_at', COALESCE(p_occurred_at, now())
            )
        );

        FOR cancelled_notification IN
            UPDATE public.app_review_notification
            SET status = 'dead_letter',
                next_attempt_at = now(),
                locked_at = NULL,
                locked_by = NULL,
                delivered_at = NULL,
                last_error = 'Cancelled because the app is banned.',
                manual_retry_blocked = true,
                payload = payload || jsonb_build_object(
                    'cancellation_reason', p_reason
                )
            WHERE submission_id = withdrawn_submission.id
              AND status IN ('pending', 'processing', 'failed')
              AND notification_type = 'submission_received'
              AND channel = 'slack'
            RETURNING id, channel, notification_type
        LOOP
            INSERT INTO public.app_review_event (
                submission_id,
                event_type,
                actor_subject,
                actor_email,
                review_version,
                payload
            )
            VALUES (
                withdrawn_submission.id,
                'notification_dead_lettered',
                p_actor_subject,
                NULL,
                withdrawn_submission.review_version,
                jsonb_build_object(
                    'notification_id', cancelled_notification.id,
                    'channel', cancelled_notification.channel,
                    'notification_type', cancelled_notification.notification_type,
                    'reason', p_reason
                )
            );
        END LOOP;
    END LOOP;
END;
$$;

CREATE FUNCTION public.withdraw_app_reviews_on_ban()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
    PERFORM public.withdraw_active_app_reviews_for_ban(
        NEW.id,
        'system:app-ban',
        'app_banned',
        now()
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER withdraw_app_reviews_on_ban
BEFORE UPDATE OF is_banned ON public.app
FOR EACH ROW
WHEN (OLD.is_banned IS FALSE AND NEW.is_banned IS DISTINCT FROM FALSE)
EXECUTE FUNCTION public.withdraw_app_reviews_on_ban();

CREATE FUNCTION public.guard_reviewer_approval_unbanned_app()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
    IF NEW.status = 'approved'
       AND OLD.status IS DISTINCT FROM 'approved'
       AND EXISTS (
           SELECT 1
           FROM public.app AS reviewed_app
           WHERE reviewed_app.id = NEW.app_id
             AND reviewed_app.is_banned IS DISTINCT FROM FALSE
       ) THEN
        RAISE EXCEPTION 'A banned app cannot be approved.';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER guard_reviewer_approval_unbanned_app
BEFORE UPDATE OF status ON public.app_review_submission
FOR EACH ROW
EXECUTE FUNCTION public.guard_reviewer_approval_unbanned_app();

DO $$
DECLARE
    banned_app record;
BEGIN
    FOR banned_app IN
        SELECT id
        FROM public.app
        WHERE is_banned IS DISTINCT FROM FALSE
        ORDER BY id
    LOOP
        PERFORM public.withdraw_active_app_reviews_for_ban(
            banned_app.id,
            'system:rollout-app-ban-reconciliation',
            'rollout_banned_app',
            now()
        );
    END LOOP;
END;
$$;
