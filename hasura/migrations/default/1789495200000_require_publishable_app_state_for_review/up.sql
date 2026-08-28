-- Listing review and public discovery require an app that can actually serve
-- World ID traffic. Serialize capture with app availability and prevent owners
-- from making a submitted app unusable without withdrawing its review first.
ALTER FUNCTION public.capture_listing_review_submission(
    text,
    text,
    text,
    text,
    boolean,
    timestamptz,
    jsonb,
    jsonb
)
RENAME TO capture_listing_review_submission_without_publishable_app_guard;

CREATE FUNCTION public.capture_listing_review_submission(
    p_app_metadata_id text,
    p_changelog text,
    p_submitted_by_subject text,
    p_submitted_by_email text,
    p_listing_consent boolean,
    p_expected_metadata_updated_at timestamptz,
    p_expected_localizations_snapshot jsonb,
    p_asset_snapshot jsonb
)
RETURNS SETOF public.app_review_submission
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
DECLARE
    metadata_app_id text;
    reviewed_app_status text;
    reviewed_app_is_archived boolean;
    reviewed_app_is_banned boolean;
BEGIN
    PERFORM pg_advisory_xact_lock(hashtextextended(p_app_metadata_id, 0));

    SELECT candidate.app_id
    INTO metadata_app_id
    FROM public.app_metadata AS candidate
    WHERE candidate.id = p_app_metadata_id
    FOR UPDATE;

    IF FOUND THEN
        SELECT candidate.status, candidate.is_archived, candidate.is_banned
        INTO reviewed_app_status, reviewed_app_is_archived, reviewed_app_is_banned
        FROM public.app AS candidate
        WHERE candidate.id = metadata_app_id
        FOR UPDATE;

        IF NOT FOUND
           OR reviewed_app_status IS DISTINCT FROM 'active'
           OR reviewed_app_is_archived IS DISTINCT FROM false
           OR reviewed_app_is_banned IS DISTINCT FROM false THEN
            RAISE EXCEPTION USING
                ERRCODE = '55000',
                MESSAGE = 'Only active, unarchived, unbanned apps can be submitted for listing review.';
        END IF;
    END IF;

    RETURN QUERY
    SELECT captured.*
    FROM public.capture_listing_review_submission_without_publishable_app_guard(
        p_app_metadata_id,
        p_changelog,
        p_submitted_by_subject,
        p_submitted_by_email,
        p_listing_consent,
        p_expected_metadata_updated_at,
        p_expected_localizations_snapshot,
        p_asset_snapshot
    ) AS captured;
END;
$$;

CREATE FUNCTION public.guard_active_app_review_publishable_state()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
    IF (
        NEW.status IS DISTINCT FROM OLD.status
        OR NEW.is_archived IS DISTINCT FROM OLD.is_archived
    )
       AND (
           NEW.status IS DISTINCT FROM 'active'
           OR NEW.is_archived IS DISTINCT FROM false
       )
       AND EXISTS (
           SELECT 1
           FROM public.app_review_submission AS active_submission
           WHERE active_submission.app_id = OLD.id
             AND active_submission.status IN ('pending', 'in_review')
       ) THEN
        RAISE EXCEPTION USING
            ERRCODE = '55000',
            MESSAGE = 'Withdraw the active listing review before deactivating or archiving this app.';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER guard_active_app_review_publishable_state
BEFORE UPDATE OF status, is_archived ON public.app
FOR EACH ROW
EXECUTE FUNCTION public.guard_active_app_review_publishable_state();

CREATE FUNCTION public.guard_reviewer_approval_publishable_app()
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
             AND (
                 reviewed_app.status IS DISTINCT FROM 'active'
                 OR reviewed_app.is_archived IS DISTINCT FROM false
             )
       ) THEN
        RAISE EXCEPTION USING
            ERRCODE = '55000',
            MESSAGE = 'An inactive or archived app cannot be approved.';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER guard_reviewer_approval_publishable_app
BEFORE UPDATE OF status ON public.app_review_submission
FOR EACH ROW
EXECUTE FUNCTION public.guard_reviewer_approval_publishable_app();

-- Close the rollout window for active reviews captured while their app was
-- already inactive or archived. Keep any prior verified version untouched.
DO $$
DECLARE
    candidate record;
    withdrawn_submission public.app_review_submission%ROWTYPE;
    cancelled_notification record;
    previous_workflow_bypass text := current_setting('reviewer.workflow_bypass', true);
BEGIN
    PERFORM set_config('reviewer.workflow_bypass', 'on', true);

    FOR candidate IN
        SELECT submission.id,
               CASE
                   WHEN reviewed_app.is_archived IS DISTINCT FROM false
                       THEN 'app_archived'
                   ELSE 'app_inactive'
               END AS reason
        FROM public.app_review_submission AS submission
        INNER JOIN public.app AS reviewed_app ON reviewed_app.id = submission.app_id
        WHERE submission.status IN ('pending', 'in_review')
          AND (
              reviewed_app.status IS DISTINCT FROM 'active'
              OR reviewed_app.is_archived IS DISTINCT FROM false
          )
        ORDER BY submission.id
        FOR UPDATE OF submission
    LOOP
        UPDATE public.app_review_submission
        SET status = 'withdrawn',
            review_version = review_version + 1,
            claim_token = NULL,
            claimed_by_subject = NULL,
            claimed_by_email = NULL,
            claimed_at = NULL,
            claim_expires_at = NULL,
            completed_at = now()
        WHERE id = candidate.id
          AND status IN ('pending', 'in_review')
        RETURNING * INTO withdrawn_submission;

        IF NOT FOUND THEN
            CONTINUE;
        END IF;

        UPDATE public.app_metadata
        SET verification_status = 'unverified'
        WHERE id = withdrawn_submission.app_metadata_id
          AND verification_status = 'awaiting_review';

        INSERT INTO public.app_review_event (
            submission_id,
            event_type,
            actor_subject,
            review_version,
            payload
        )
        VALUES (
            withdrawn_submission.id,
            'withdrawn',
            'system:rollout-app-availability-reconciliation',
            withdrawn_submission.review_version,
            jsonb_build_object(
                'reason', candidate.reason,
                'rollout_reconciliation', true
            )
        );

        FOR cancelled_notification IN
            UPDATE public.app_review_notification
            SET status = 'dead_letter',
                next_attempt_at = now(),
                locked_at = NULL,
                locked_by = NULL,
                delivered_at = NULL,
                last_error = 'Cancelled because the app is inactive or archived.',
                manual_retry_blocked = true,
                payload = payload || jsonb_build_object(
                    'cancellation_reason', candidate.reason
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
                review_version,
                payload
            )
            VALUES (
                withdrawn_submission.id,
                'notification_dead_lettered',
                'system:rollout-app-availability-reconciliation',
                withdrawn_submission.review_version,
                jsonb_build_object(
                    'notification_id', cancelled_notification.id,
                    'channel', cancelled_notification.channel,
                    'notification_type', cancelled_notification.notification_type,
                    'reason', candidate.reason
                )
            );
        END LOOP;
    END LOOP;

    PERFORM set_config(
        'reviewer.workflow_bypass',
        COALESCE(previous_workflow_bypass, ''),
        true
    );
EXCEPTION WHEN OTHERS THEN
    PERFORM set_config(
        'reviewer.workflow_bypass',
        COALESCE(previous_workflow_bypass, ''),
        true
    );
    RAISE;
END;
$$;
