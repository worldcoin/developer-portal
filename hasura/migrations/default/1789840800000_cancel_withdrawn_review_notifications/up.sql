-- Preserve the exact pre-hardening operations so this follow-on migration can
-- roll back independently without rewriting earlier, already-applied files.
ALTER FUNCTION public.developer_withdraw_active_review_draft(
    text,
    timestamptz,
    uuid,
    integer,
    text,
    text
) RENAME TO developer_withdraw_active_review_draft_before_notification_cancellation;

DROP TRIGGER withdraw_app_reviews_on_soft_delete ON public.app;
ALTER FUNCTION public.withdraw_app_reviews_on_soft_delete()
RENAME TO withdraw_app_reviews_on_soft_delete_before_lock_order_fix;

DROP TRIGGER withdraw_team_reviews_on_soft_delete ON public.team;
ALTER FUNCTION public.withdraw_team_reviews_on_soft_delete()
RENAME TO withdraw_team_reviews_on_soft_delete_before_lock_order_fix;

ALTER FUNCTION public.withdraw_active_app_reviews_for_ban(
    text,
    text,
    text,
    timestamptz
) RENAME TO withdraw_active_app_reviews_for_ban_before_lock_order_fix;

ALTER FUNCTION public.reviewer_claim_app_review_notifications(text, integer)
RENAME TO reviewer_claim_app_review_notifications_before_terminal_fence;

ALTER FUNCTION public.reviewer_complete_app_review_notification(
    uuid,
    text,
    text,
    text,
    text
) RENAME TO reviewer_complete_app_review_notification_before_terminal_fence;

ALTER FUNCTION public.reviewer_retry_app_review_notification(
    uuid,
    uuid,
    text,
    text
) RENAME TO reviewer_retry_app_review_notification_before_lock_order_fix;

ALTER FUNCTION public.reviewer_set_app_review_asset_snapshot(uuid, integer, jsonb)
RENAME TO reviewer_set_app_review_asset_snapshot_before_lock_order_fix;

ALTER FUNCTION public.reconcile_app_review_asset_snapshot_repair(uuid, jsonb)
RENAME TO reconcile_app_review_asset_snapshot_repair_before_lock_order_fix;

ALTER FUNCTION public.reconcile_uncaptured_listing_review_submission(text)
RENAME TO reconcile_uncaptured_listing_review_submission_before_lock_order_fix;

CREATE FUNCTION public.cancel_app_review_submission_received_notification(
    p_submission_id uuid,
    p_actor_subject text,
    p_reason text,
    p_last_error text
)
RETURNS integer
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
DECLARE
    submission public.app_review_submission%ROWTYPE;
    candidate_notification_id uuid;
    locked_notification public.app_review_notification%ROWTYPE;
    cancelled_notification record;
    cancelled_count integer := 0;
    fence_expires_at timestamptz;
BEGIN
    IF p_submission_id IS NULL
       OR btrim(COALESCE(p_actor_subject, '')) = ''
       OR char_length(p_actor_subject) > 200
       OR btrim(COALESCE(p_reason, '')) = ''
       OR char_length(p_reason) > 128 THEN
        RETURN 0;
    END IF;

    SELECT candidate.*
    INTO submission
    FROM public.app_review_submission AS candidate
    WHERE candidate.id = p_submission_id
    FOR UPDATE;

    IF NOT FOUND OR submission.status IS DISTINCT FROM 'withdrawn' THEN
        RETURN 0;
    END IF;

    FOR candidate_notification_id IN
        SELECT notification.id
        FROM public.app_review_notification AS notification
        WHERE notification.submission_id = submission.id
          AND (
              notification.status IN ('pending', 'processing', 'failed')
              OR (
                  notification.status = 'dead_letter'
                  AND notification.manual_retry_blocked IS FALSE
              )
          )
          AND notification.notification_type = 'submission_received'
          AND notification.channel = 'slack'
        ORDER BY notification.id
    LOOP
        SELECT notification.*
        INTO locked_notification
        FROM public.app_review_notification AS notification
        WHERE notification.id = candidate_notification_id
        FOR UPDATE;

        IF NOT FOUND
           OR (
               locked_notification.status NOT IN ('pending', 'processing', 'failed')
               AND NOT (
                   locked_notification.status = 'dead_letter'
                   AND locked_notification.manual_retry_blocked IS FALSE
               )
           ) THEN
            CONTINUE;
        END IF;

        fence_expires_at := NULL;
        BEGIN
            fence_expires_at := NULLIF(
                locked_notification.payload #>> '{provider_send_fence,expires_at}',
                ''
            )::timestamptz;
        EXCEPTION WHEN invalid_datetime_format OR datetime_field_overflow THEN
            fence_expires_at := NULL;
        END;

        -- Once the worker arms this short fence, a terminal transition must
        -- retry after provider completion/expiry. That makes it impossible
        -- for a withdrawal to commit before a later Slack send.
        IF NULLIF(
               locked_notification.payload #>> '{provider_send_fence,token}',
               ''
           ) IS NOT NULL
           AND fence_expires_at > clock_timestamp() THEN
            RAISE EXCEPTION USING
                ERRCODE = '55P03',
                MESSAGE = 'A Slack provider send is already in progress.';
        END IF;

        UPDATE public.app_review_notification
        SET status = 'dead_letter',
            next_attempt_at = now(),
            locked_at = NULL,
            locked_by = NULL,
            delivered_at = NULL,
            provider_message_id = NULL,
            last_error = left(
                COALESCE(
                    NULLIF(btrim(p_last_error), ''),
                    'Cancelled because the review is no longer active.'
                ),
                500
            ),
            manual_retry_blocked = true,
            payload = payload || jsonb_build_object(
                'cancellation_reason', p_reason,
                'cancelled_at', now()
            )
        WHERE id = candidate_notification_id
          AND (
              status IN ('pending', 'processing', 'failed')
              OR (status = 'dead_letter' AND manual_retry_blocked IS FALSE)
          )
          AND notification_type = 'submission_received'
          AND channel = 'slack'
        RETURNING id, channel, notification_type INTO cancelled_notification;

        IF NOT FOUND THEN
            CONTINUE;
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
            'notification_dead_lettered',
            p_actor_subject,
            submission.review_version,
            jsonb_build_object(
                'notification_id', cancelled_notification.id,
                'channel', cancelled_notification.channel,
                'notification_type', cancelled_notification.notification_type,
                'reason', p_reason
            )
        );
        cancelled_count := cancelled_count + 1;
    END LOOP;

    RETURN cancelled_count;
END;
$$;

CREATE FUNCTION public.reviewer_begin_app_review_submission_slack_delivery(
    p_notification_id uuid,
    p_worker_id text,
    p_fence_token uuid
)
RETURNS SETOF public.app_review_notification
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
DECLARE
    observed_submission_id uuid;
    submission public.app_review_submission%ROWTYPE;
    notification public.app_review_notification%ROWTYPE;
    existing_fence_expires_at timestamptz;
BEGIN
    IF p_notification_id IS NULL
       OR btrim(COALESCE(p_worker_id, '')) = ''
       OR char_length(p_worker_id) > 128
       OR p_fence_token IS NULL THEN
        RETURN;
    END IF;

    SELECT candidate.submission_id
    INTO observed_submission_id
    FROM public.app_review_notification AS candidate
    WHERE candidate.id = p_notification_id;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    -- All terminal transitions take the same submission-before-notification
    -- order. The worker holds no database lock during the provider request;
    -- the durable 30-second fence is what prevents a terminal commit from
    -- overtaking an already-authorized send.
    SELECT candidate.*
    INTO submission
    FROM public.app_review_submission AS candidate
    WHERE candidate.id = observed_submission_id
    FOR UPDATE;

    IF NOT FOUND OR submission.status = 'withdrawn' THEN
        RETURN;
    END IF;

    SELECT candidate.*
    INTO notification
    FROM public.app_review_notification AS candidate
    WHERE candidate.id = p_notification_id
    FOR UPDATE;

    IF NOT FOUND
       OR notification.submission_id IS DISTINCT FROM submission.id
       OR notification.notification_type IS DISTINCT FROM 'submission_received'
       OR notification.channel IS DISTINCT FROM 'slack'
       OR notification.status IS DISTINCT FROM 'processing'
       OR notification.locked_by IS DISTINCT FROM p_worker_id
       OR notification.locked_at IS NULL
       OR notification.locked_at <= now() - interval '5 minutes' THEN
        RETURN;
    END IF;

    BEGIN
        existing_fence_expires_at := NULLIF(
            notification.payload #>> '{provider_send_fence,expires_at}',
            ''
        )::timestamptz;
    EXCEPTION WHEN invalid_datetime_format OR datetime_field_overflow THEN
        existing_fence_expires_at := NULL;
    END;

    IF notification.payload #>> '{provider_send_fence,token}' = p_fence_token::text
       AND notification.payload #>> '{provider_send_fence,worker_id}' = p_worker_id
       AND existing_fence_expires_at > clock_timestamp() THEN
        RETURN NEXT notification;
        RETURN;
    END IF;

    IF NULLIF(notification.payload #>> '{provider_send_fence,token}', '') IS NOT NULL
       AND existing_fence_expires_at > clock_timestamp() THEN
        RETURN;
    END IF;

    UPDATE public.app_review_notification
    SET payload = payload || jsonb_build_object(
            'provider_send_fence', jsonb_build_object(
                'token', p_fence_token,
                'worker_id', p_worker_id,
                'armed_at', clock_timestamp(),
                'expires_at', clock_timestamp() + interval '30 seconds'
            )
        )
    WHERE id = notification.id
      AND status = 'processing'
      AND locked_by = p_worker_id
    RETURNING * INTO notification;

    IF FOUND THEN
        RETURN NEXT notification;
    END IF;
END;
$$;

CREATE FUNCTION public.developer_withdraw_active_review_draft(
    p_app_metadata_id text,
    p_expected_metadata_updated_at timestamptz,
    p_expected_submission_id uuid,
    p_expected_review_version integer,
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
    previous_workflow_bypass text := current_setting('reviewer.workflow_bypass', true);
    metadata public.app_metadata%ROWTYPE;
    reviewed_app public.app%ROWTYPE;
    withdrawn_metadata public.app_metadata%ROWTYPE;
    submission public.app_review_submission%ROWTYPE;
    is_listing_review boolean;
BEGIN
    IF p_app_metadata_id IS NULL
       OR p_expected_metadata_updated_at IS NULL
       OR btrim(COALESCE(p_actor_subject, '')) = ''
       OR ((p_expected_submission_id IS NULL) <> (p_expected_review_version IS NULL))
       OR (p_expected_review_version IS NOT NULL AND p_expected_review_version <= 0) THEN
        RETURN;
    END IF;

    PERFORM pg_advisory_xact_lock(hashtextextended(p_app_metadata_id, 0));

    SELECT candidate.*
    INTO metadata
    FROM public.app_metadata AS candidate
    WHERE candidate.id = p_app_metadata_id
    FOR UPDATE;

    IF NOT FOUND
       OR metadata.verification_status IS DISTINCT FROM 'awaiting_review'
       OR metadata.updated_at IS DISTINCT FROM p_expected_metadata_updated_at THEN
        RETURN;
    END IF;

    SELECT candidate.*
    INTO reviewed_app
    FROM public.app AS candidate
    WHERE candidate.id = metadata.app_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    is_listing_review := metadata.app_mode IN ('mini-app', 'external')
        AND metadata.is_developer_allow_listing IS TRUE;

    SELECT candidate.*
    INTO submission
    FROM public.app_review_submission AS candidate
    WHERE candidate.app_metadata_id = p_app_metadata_id
      AND candidate.status IN ('pending', 'in_review')
    ORDER BY candidate.attempt DESC
    LIMIT 1
    FOR UPDATE;

    IF FOUND THEN
        IF submission.id IS DISTINCT FROM p_expected_submission_id
           OR submission.review_version IS DISTINCT FROM p_expected_review_version THEN
            RETURN;
        END IF;
    ELSIF is_listing_review
          OR p_expected_submission_id IS NOT NULL
          OR p_expected_review_version IS NOT NULL THEN
        RETURN;
    END IF;

    PERFORM set_config('reviewer.workflow_bypass', 'on', true);
    BEGIN
        UPDATE public.app_metadata
        SET verification_status = 'unverified'
        WHERE id = metadata.id
          AND verification_status = 'awaiting_review'
          AND updated_at = p_expected_metadata_updated_at
        RETURNING * INTO withdrawn_metadata;

        IF NOT FOUND THEN
            PERFORM set_config(
                'reviewer.workflow_bypass',
                COALESCE(previous_workflow_bypass, ''),
                true
            );
            RETURN;
        END IF;

        IF submission.id IS NOT NULL THEN
            UPDATE public.app_review_submission
            SET status = 'withdrawn',
                review_version = review_version + 1,
                claim_token = NULL,
                claimed_by_subject = NULL,
                claimed_by_email = NULL,
                claimed_at = NULL,
                claim_expires_at = NULL,
                completed_at = now()
            WHERE id = submission.id
              AND review_version = p_expected_review_version
              AND status IN ('pending', 'in_review')
            RETURNING * INTO submission;

            IF NOT FOUND THEN
                RAISE EXCEPTION 'Review submission changed during withdrawal.';
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
                'withdrawn',
                p_actor_subject,
                p_actor_email,
                submission.review_version,
                jsonb_build_object('attempt', submission.attempt)
            );

            PERFORM public.cancel_app_review_submission_received_notification(
                submission.id,
                p_actor_subject,
                'developer_withdrawal',
                'Cancelled because the developer withdrew the review.'
            );
        END IF;
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
    RETURN NEXT withdrawn_metadata;
END;
$$;

CREATE FUNCTION public.withdraw_active_app_reviews_for_transition(
    p_app_id text,
    p_actor_subject text,
    p_reason text,
    p_occurred_at timestamptz,
    p_last_error text
)
RETURNS void
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
DECLARE
    candidate record;
    withdrawn_submission public.app_review_submission%ROWTYPE;
BEGIN
    IF p_app_id IS NULL
       OR btrim(COALESCE(p_actor_subject, '')) = ''
       OR p_reason NOT IN (
           'app_deleted',
           'app_banned',
           'rollout_banned_app'
       ) THEN
        RETURN;
    END IF;

    -- App row triggers already own the parent tuple. A blocking advisory lock
    -- here could deadlock with a decision holding metadata and waiting for the
    -- app. Try-locking makes that ordering conflict a retryable statement
    -- failure; once owned, no decision can enter the inverse path.
    FOR candidate IN
        SELECT DISTINCT active_submission.app_metadata_id
        FROM public.app_review_submission AS active_submission
        WHERE active_submission.app_id = p_app_id
          AND active_submission.status IN ('pending', 'in_review')
        ORDER BY active_submission.app_metadata_id
    LOOP
        IF NOT pg_try_advisory_xact_lock(
            hashtextextended(candidate.app_metadata_id, 0)
        ) THEN
            RAISE EXCEPTION USING
                ERRCODE = '55P03',
                MESSAGE = 'A concurrent review decision must finish before this app transition.';
        END IF;
    END LOOP;

    BEGIN
        PERFORM metadata.id
        FROM public.app_metadata AS metadata
        INNER JOIN (
            SELECT DISTINCT active_submission.app_metadata_id
            FROM public.app_review_submission AS active_submission
            WHERE active_submission.app_id = p_app_id
              AND active_submission.status IN ('pending', 'in_review')
        ) AS active_metadata
            ON active_metadata.app_metadata_id = metadata.id
        ORDER BY metadata.id
        FOR UPDATE OF metadata NOWAIT;
    EXCEPTION WHEN lock_not_available THEN
        RAISE EXCEPTION USING
            ERRCODE = '55P03',
            MESSAGE = 'A concurrent metadata update must finish before this app transition.';
    END;

    PERFORM reviewed_app.id
    FROM public.app AS reviewed_app
    WHERE reviewed_app.id = p_app_id
    FOR UPDATE;

    FOR candidate IN
        SELECT active_submission.id
        FROM public.app_review_submission AS active_submission
        WHERE active_submission.app_id = p_app_id
          AND active_submission.status IN ('pending', 'in_review')
        ORDER BY active_submission.app_metadata_id, active_submission.id
        FOR UPDATE
    LOOP
        UPDATE public.app_review_submission
        SET status = 'withdrawn',
            review_version = review_version + 1,
            claim_token = NULL,
            claimed_by_subject = NULL,
            claimed_by_email = NULL,
            claimed_at = NULL,
            claim_expires_at = NULL,
            completed_at = COALESCE(p_occurred_at, now())
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
            p_actor_subject,
            withdrawn_submission.review_version,
            jsonb_build_object(
                'reason', p_reason,
                'occurred_at', COALESCE(p_occurred_at, now())
            )
        );

        PERFORM public.cancel_app_review_submission_received_notification(
            withdrawn_submission.id,
            p_actor_subject,
            p_reason,
            p_last_error
        );
    END LOOP;
END;
$$;

CREATE FUNCTION public.withdraw_app_reviews_on_soft_delete()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
    PERFORM public.withdraw_active_app_reviews_for_transition(
        NEW.id,
        'system:app-deletion',
        'app_deleted',
        NEW.deleted_at,
        'Cancelled because the app was deleted.'
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER withdraw_app_reviews_on_soft_delete
BEFORE UPDATE OF deleted_at ON public.app
FOR EACH ROW
WHEN (OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL)
EXECUTE FUNCTION public.withdraw_app_reviews_on_soft_delete();

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
BEGIN
    IF p_reason NOT IN ('app_banned', 'rollout_banned_app') THEN
        RETURN;
    END IF;

    PERFORM public.withdraw_active_app_reviews_for_transition(
        p_app_id,
        p_actor_subject,
        p_reason,
        p_occurred_at,
        'Cancelled because the app is banned.'
    );
END;
$$;

CREATE FUNCTION public.withdraw_active_team_reviews_for_transition(
    p_team_id text,
    p_actor_subject text,
    p_reason text,
    p_occurred_at timestamptz,
    p_last_error text
)
RETURNS void
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
DECLARE
    candidate record;
    withdrawn_submission public.app_review_submission%ROWTYPE;
BEGIN
    IF p_team_id IS NULL
       OR btrim(COALESCE(p_actor_subject, '')) = ''
       OR p_reason <> 'team_deleted' THEN
        RETURN;
    END IF;

    FOR candidate IN
        SELECT DISTINCT active_submission.app_metadata_id
        FROM public.app_review_submission AS active_submission
        WHERE active_submission.team_id = p_team_id
          AND active_submission.status IN ('pending', 'in_review')
        ORDER BY active_submission.app_metadata_id
    LOOP
        IF NOT pg_try_advisory_xact_lock(
            hashtextextended(candidate.app_metadata_id, 0)
        ) THEN
            RAISE EXCEPTION USING
                ERRCODE = '55P03',
                MESSAGE = 'A concurrent review decision must finish before this team transition.';
        END IF;
    END LOOP;

    BEGIN
        PERFORM metadata.id
        FROM public.app_metadata AS metadata
        INNER JOIN (
            SELECT DISTINCT active_submission.app_metadata_id
            FROM public.app_review_submission AS active_submission
            WHERE active_submission.team_id = p_team_id
              AND active_submission.status IN ('pending', 'in_review')
        ) AS active_metadata
            ON active_metadata.app_metadata_id = metadata.id
        ORDER BY metadata.id
        FOR UPDATE OF metadata NOWAIT;
    EXCEPTION WHEN lock_not_available THEN
        RAISE EXCEPTION USING
            ERRCODE = '55P03',
            MESSAGE = 'A concurrent metadata update must finish before this team transition.';
    END;

    PERFORM owning_team.id
    FROM public.team AS owning_team
    WHERE owning_team.id = p_team_id
    FOR UPDATE;

    PERFORM reviewed_app.id
    FROM public.app AS reviewed_app
    WHERE reviewed_app.team_id = p_team_id
      AND EXISTS (
          SELECT 1
          FROM public.app_review_submission AS active_submission
          WHERE active_submission.app_id = reviewed_app.id
            AND active_submission.status IN ('pending', 'in_review')
      )
    ORDER BY reviewed_app.id
    FOR UPDATE;

    FOR candidate IN
        SELECT active_submission.id
        FROM public.app_review_submission AS active_submission
        WHERE active_submission.team_id = p_team_id
          AND active_submission.status IN ('pending', 'in_review')
        ORDER BY active_submission.app_metadata_id, active_submission.id
        FOR UPDATE
    LOOP
        UPDATE public.app_review_submission
        SET status = 'withdrawn',
            review_version = review_version + 1,
            claim_token = NULL,
            claimed_by_subject = NULL,
            claimed_by_email = NULL,
            claimed_at = NULL,
            claim_expires_at = NULL,
            completed_at = COALESCE(p_occurred_at, now())
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
            p_actor_subject,
            withdrawn_submission.review_version,
            jsonb_build_object(
                'reason', p_reason,
                'occurred_at', COALESCE(p_occurred_at, now())
            )
        );

        PERFORM public.cancel_app_review_submission_received_notification(
            withdrawn_submission.id,
            p_actor_subject,
            p_reason,
            p_last_error
        );
    END LOOP;
END;
$$;

CREATE FUNCTION public.withdraw_team_reviews_on_soft_delete()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
    PERFORM public.withdraw_active_team_reviews_for_transition(
        NEW.id,
        'system:team-deletion',
        'team_deleted',
        NEW.deleted_at,
        'Cancelled because the team was deleted.'
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER withdraw_team_reviews_on_soft_delete
BEFORE UPDATE OF deleted_at ON public.team
FOR EACH ROW
WHEN (OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL)
EXECUTE FUNCTION public.withdraw_team_reviews_on_soft_delete();

CREATE FUNCTION public.reviewer_set_app_review_asset_snapshot(
    p_submission_id uuid,
    p_expected_review_version integer,
    p_asset_snapshot jsonb
)
RETURNS SETOF public.app_review_submission
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
DECLARE
    observed_submission public.app_review_submission%ROWTYPE;
    submission public.app_review_submission%ROWTYPE;
    current_metadata public.app_metadata%ROWTYPE;
    current_localizations jsonb;
BEGIN
    IF p_submission_id IS NULL
       OR p_expected_review_version IS NULL
       OR p_expected_review_version <= 0 THEN
        RETURN;
    END IF;

    -- Resolve the immutable metadata identity without taking the submission
    -- lock. The exact row is revalidated after the advisory/metadata locks.
    SELECT candidate.*
    INTO observed_submission
    FROM public.app_review_submission AS candidate
    WHERE candidate.id = p_submission_id;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    PERFORM pg_advisory_xact_lock(
        hashtextextended(observed_submission.app_metadata_id, 0)
    );

    SELECT metadata.*
    INTO current_metadata
    FROM public.app_metadata AS metadata
    WHERE metadata.id = observed_submission.app_metadata_id
      AND metadata.app_id = observed_submission.app_id
      AND metadata.verification_status = 'awaiting_review'
      AND metadata.updated_at = observed_submission.metadata_updated_at
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    SELECT COALESCE(
        jsonb_agg(
            to_jsonb(locked_localization)
            ORDER BY locked_localization.locale, locked_localization.id
        ),
        '[]'::jsonb
    )
    INTO current_localizations
    FROM (
        SELECT localization.*
        FROM public.localisations AS localization
        WHERE localization.app_metadata_id = observed_submission.app_metadata_id
        ORDER BY localization.locale, localization.id
        FOR UPDATE
    ) AS locked_localization;

    SELECT candidate.*
    INTO submission
    FROM public.app_review_submission AS candidate
    WHERE candidate.id = p_submission_id
    FOR UPDATE;

    IF NOT FOUND
       OR submission.review_version IS DISTINCT FROM p_expected_review_version
       OR submission.status NOT IN ('pending', 'in_review')
       OR submission.asset_snapshot IS NOT NULL
       OR submission.app_metadata_id IS DISTINCT FROM observed_submission.app_metadata_id
       OR submission.app_id IS DISTINCT FROM observed_submission.app_id
       OR submission.metadata_updated_at IS DISTINCT FROM observed_submission.metadata_updated_at
       OR current_localizations IS DISTINCT FROM submission.localizations_snapshot
       OR NOT public.is_valid_reviewer_asset_snapshot(
           p_asset_snapshot,
           submission.app_id,
           submission.app_metadata_id,
           submission.metadata_snapshot
       ) THEN
        RETURN;
    END IF;

    UPDATE public.app_review_submission
    SET asset_snapshot = p_asset_snapshot
    WHERE id = submission.id
      AND review_version = p_expected_review_version
      AND status IN ('pending', 'in_review')
      AND asset_snapshot IS NULL
    RETURNING * INTO submission;

    IF FOUND THEN
        RETURN NEXT submission;
    END IF;
END;
$$;

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
    observed_app_metadata_id text;
    observed_app_id text;
    submission public.app_review_submission%ROWTYPE;
    current_metadata public.app_metadata%ROWTYPE;
BEGIN
    IF p_submission_id IS NULL
       OR p_asset_snapshot IS NULL
       OR jsonb_typeof(p_asset_snapshot) <> 'object' THEN
        RETURN;
    END IF;

    SELECT candidate.app_metadata_id, candidate.app_id
    INTO observed_app_metadata_id, observed_app_id
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
      AND metadata.app_id = observed_app_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    SELECT candidate.*
    INTO submission
    FROM public.app_review_submission AS candidate
    WHERE candidate.id = p_submission_id
      AND candidate.app_metadata_id = observed_app_metadata_id
      AND candidate.app_id = observed_app_id
    FOR UPDATE;

    IF FOUND AND submission.asset_snapshot = p_asset_snapshot THEN
        RETURN NEXT submission;
    END IF;
END;
$$;

COMMENT ON FUNCTION public.reconcile_app_review_asset_snapshot_repair(uuid, jsonb) IS
'Waits behind asset snapshot repair using the shared metadata lock order and returns only its exact committed manifest.';

CREATE FUNCTION public.reconcile_uncaptured_listing_review_submission_locked(
    p_app_metadata_id text
)
RETURNS uuid
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
DECLARE
    metadata public.app_metadata%ROWTYPE;
    reviewed_app public.app%ROWTYPE;
    owning_team public.team%ROWTYPE;
    captured_submission public.app_review_submission%ROWTYPE;
    localizations_snapshot jsonb;
    next_attempt integer;
    listing_target text;
BEGIN
    SELECT candidate.*
    INTO metadata
    FROM public.app_metadata AS candidate
    WHERE candidate.id = p_app_metadata_id
    FOR UPDATE;

    IF NOT FOUND
       OR metadata.verification_status IS DISTINCT FROM 'awaiting_review'
       OR metadata.is_developer_allow_listing IS NOT TRUE
       OR metadata.app_mode IS NULL
       OR metadata.app_mode NOT IN ('mini-app', 'external')
       OR NOT public.is_valid_reviewer_integration_url(metadata.integration_url) THEN
        RETURN NULL;
    END IF;

    SELECT candidate.*
    INTO reviewed_app
    FROM public.app AS candidate
    WHERE candidate.id = metadata.app_id
    FOR UPDATE;

    IF NOT FOUND
       OR reviewed_app.is_staging IS NOT FALSE
       OR reviewed_app.is_banned IS DISTINCT FROM FALSE
       OR reviewed_app.status IS DISTINCT FROM 'active'
       OR reviewed_app.is_archived IS DISTINCT FROM FALSE
       OR reviewed_app.deleted_at IS NOT NULL THEN
        RETURN NULL;
    END IF;

    SELECT candidate.*
    INTO owning_team
    FROM public.team AS candidate
    WHERE candidate.id = reviewed_app.team_id
    FOR UPDATE;

    IF NOT FOUND OR owning_team.deleted_at IS NOT NULL THEN
        RETURN NULL;
    END IF;

    SELECT candidate.*
    INTO captured_submission
    FROM public.app_review_submission AS candidate
    WHERE candidate.app_metadata_id = metadata.id
      AND candidate.status IN ('pending', 'in_review')
    ORDER BY candidate.attempt DESC
    LIMIT 1
    FOR UPDATE;

    IF captured_submission.id IS NULL THEN
        SELECT COALESCE(
            jsonb_agg(
                to_jsonb(locked_localization)
                ORDER BY locked_localization.locale, locked_localization.id
            ),
            '[]'::jsonb
        )
        INTO localizations_snapshot
        FROM (
            SELECT localization.*
            FROM public.localisations AS localization
            WHERE localization.app_metadata_id = metadata.id
            ORDER BY localization.locale, localization.id
            FOR UPDATE
        ) AS locked_localization;

        SELECT COALESCE(MAX(previous_submission.attempt), 0) + 1
        INTO next_attempt
        FROM public.app_review_submission AS previous_submission
        WHERE previous_submission.app_metadata_id = metadata.id;

        listing_target := CASE metadata.app_mode
            WHEN 'mini-app' THEN 'mini_app_store'
            ELSE 'world_ecosystem'
        END;

        INSERT INTO public.app_review_submission (
            app_metadata_id,
            app_id,
            team_id,
            attempt,
            status,
            app_mode,
            listing_target,
            listing_consent,
            changelog,
            submitted_at,
            metadata_updated_at,
            submitted_by_subject,
            submitted_by_email,
            metadata_snapshot,
            localizations_snapshot,
            asset_snapshot
        )
        VALUES (
            metadata.id,
            metadata.app_id,
            reviewed_app.team_id,
            next_attempt,
            'pending',
            metadata.app_mode,
            listing_target,
            true,
            COALESCE(metadata.changelog, ''),
            metadata.updated_at,
            metadata.updated_at,
            'system:legacy-listing-bridge',
            NULL,
            to_jsonb(metadata),
            localizations_snapshot,
            NULL
        )
        ON CONFLICT DO NOTHING
        RETURNING * INTO captured_submission;

        IF captured_submission.id IS NULL THEN
            SELECT candidate.*
            INTO captured_submission
            FROM public.app_review_submission AS candidate
            WHERE candidate.app_metadata_id = metadata.id
              AND candidate.status IN ('pending', 'in_review')
            ORDER BY candidate.attempt DESC
            LIMIT 1;
        END IF;
    END IF;

    IF captured_submission.id IS NULL THEN
        RETURN NULL;
    END IF;

    INSERT INTO public.app_review_event (
        submission_id,
        event_type,
        actor_subject,
        actor_email,
        review_version,
        payload,
        created_at
    )
    VALUES (
        captured_submission.id,
        'submitted',
        'system:legacy-listing-bridge',
        NULL,
        captured_submission.review_version,
        jsonb_build_object(
            'attempt', captured_submission.attempt,
            'app_mode', captured_submission.app_mode,
            'listing_target', captured_submission.listing_target,
            'legacy_bridge', true
        ),
        captured_submission.submitted_at
    )
    ON CONFLICT DO NOTHING;

    INSERT INTO public.app_review_notification (
        submission_id,
        notification_type,
        channel,
        dedupe_key,
        payload
    )
    VALUES (
        captured_submission.id,
        'submission_received',
        'slack',
        'review-submission:' || captured_submission.id::text || ':submission_received',
        jsonb_build_object(
            'submission_id', captured_submission.id,
            'app_metadata_id', captured_submission.app_metadata_id,
            'app_id', captured_submission.app_id,
            'team_id', captured_submission.team_id,
            'attempt', captured_submission.attempt,
            'app_mode', captured_submission.app_mode,
            'listing_target', captured_submission.listing_target
        )
    )
    ON CONFLICT (dedupe_key) DO NOTHING;

    RETURN captured_submission.id;
END;
$$;

CREATE FUNCTION public.reconcile_uncaptured_listing_review_submission(
    p_app_metadata_id text
)
RETURNS uuid
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
BEGIN
    PERFORM pg_advisory_xact_lock(hashtextextended(p_app_metadata_id, 0));
    RETURN public.reconcile_uncaptured_listing_review_submission_locked(
        p_app_metadata_id
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.bridge_uncaptured_listing_review_submission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
BEGIN
    IF current_setting('reviewer.workflow_bypass', true) = 'on' THEN
        RETURN NEW;
    END IF;

    IF NEW.verification_status = 'awaiting_review'
       AND NEW.is_developer_allow_listing IS TRUE
       AND NEW.app_mode IN ('mini-app', 'external')
       AND public.is_valid_reviewer_integration_url(NEW.integration_url) THEN
        -- The AFTER trigger already owns the metadata row. Calling the
        -- advisory-first standalone wrapper here would invert capture and
        -- withdrawal; the locked inner operation deliberately does not wait
        -- on that advisory.
        PERFORM public.reconcile_uncaptured_listing_review_submission_locked(NEW.id);
    END IF;

    RETURN NEW;
END;
$$;

CREATE FUNCTION public.reconcile_terminal_app_review_submission_notifications(
    p_limit integer
)
RETURNS integer
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
DECLARE
    terminal_submission record;
    cancelled_count integer := 0;
BEGIN
    IF p_limit IS NULL OR p_limit < 1 OR p_limit > 500 THEN
        RETURN 0;
    END IF;

    FOR terminal_submission IN
        SELECT submission.id, submission.status
        FROM public.app_review_submission AS submission
        WHERE submission.status = 'withdrawn'
          AND EXISTS (
              SELECT 1
              FROM public.app_review_notification AS notification
              WHERE notification.submission_id = submission.id
                AND notification.notification_type = 'submission_received'
                AND notification.channel = 'slack'
                AND (
                    notification.status IN ('pending', 'processing', 'failed')
                    OR (
                        notification.status = 'dead_letter'
                        AND notification.manual_retry_blocked IS FALSE
                    )
                )
          )
        ORDER BY submission.completed_at NULLS LAST, submission.id
        FOR UPDATE OF submission SKIP LOCKED
        LIMIT p_limit
    LOOP
        cancelled_count := cancelled_count
            + public.cancel_app_review_submission_received_notification(
                terminal_submission.id,
                'system:notification-terminal-reconciliation',
                'submission_withdrawn',
                'Cancelled because the review is no longer active.'
            );
    END LOOP;

    RETURN cancelled_count;
END;
$$;

CREATE FUNCTION public.reviewer_claim_app_review_notifications(
    p_worker_id text,
    p_limit integer
)
RETURNS SETOF public.app_review_notification
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
DECLARE
    candidate_notification_id uuid;
    locked_submission public.app_review_submission%ROWTYPE;
    locked_notification public.app_review_notification%ROWTYPE;
    claimed_notification public.app_review_notification%ROWTYPE;
    claimed_count integer := 0;
    retryable boolean;
BEGIN
    IF btrim(COALESCE(p_worker_id, '')) = ''
       OR char_length(p_worker_id) > 128
       OR p_limit IS NULL
       OR p_limit < 1
       OR p_limit > 50 THEN
        RETURN;
    END IF;

    -- Repair terminal rows left by older application code before considering
    -- delivery candidates. The same helper is also run once at rollout.
    PERFORM public.reconcile_terminal_app_review_submission_notifications(
        LEAST(500, p_limit * 10)
    );

    FOR candidate_notification_id IN
        SELECT notification.id
        FROM public.app_review_notification AS notification
        WHERE (
                notification.status IN ('pending', 'failed')
                AND notification.next_attempt_at <= now()
            ) OR (
                notification.status = 'processing'
                AND (
                    notification.locked_at IS NULL
                    OR notification.locked_at <= now() - interval '5 minutes'
                )
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
        LIMIT p_limit * 20
    LOOP
        EXIT WHEN claimed_count >= p_limit;

        -- All workflow transitions lock submission before notification. Do
        -- the same for claims so cancellation and delivery cannot deadlock.
        SELECT submission.*
        INTO locked_submission
        FROM public.app_review_submission AS submission
        WHERE submission.id = (
            SELECT notification.submission_id
            FROM public.app_review_notification AS notification
            WHERE notification.id = candidate_notification_id
        )
        FOR UPDATE SKIP LOCKED;

        IF NOT FOUND THEN
            CONTINUE;
        END IF;

        SELECT notification.*
        INTO locked_notification
        FROM public.app_review_notification AS notification
        WHERE notification.id = candidate_notification_id
          AND notification.submission_id = locked_submission.id
        FOR UPDATE SKIP LOCKED;

        IF NOT FOUND THEN
            CONTINUE;
        END IF;

        IF locked_notification.notification_type = 'submission_received'
           AND locked_notification.channel = 'slack'
           AND locked_submission.status = 'withdrawn' THEN
            PERFORM public.cancel_app_review_submission_received_notification(
                locked_submission.id,
                'system:notification-terminal-reconciliation',
                'submission_withdrawn',
                'Cancelled because the review is no longer active.'
            );
            CONTINUE;
        END IF;

        retryable := (
                locked_notification.status IN ('pending', 'failed')
                AND locked_notification.next_attempt_at <= now()
            ) OR (
                locked_notification.status = 'processing'
                AND (
                    locked_notification.locked_at IS NULL
                    OR locked_notification.locked_at <= now() - interval '5 minutes'
                )
            );

        IF NOT retryable THEN
            CONTINUE;
        END IF;

        -- A prepared-asset operation with a live exact review lease must be
        -- reconciled only after the matching decision has settled.
        IF locked_notification.notification_type = 'asset_cleanup'
           AND locked_notification.payload ->> 'cleanup_kind' = 'prepared_operation_settlement'
           AND locked_notification.payload ->> 'settlement_state' = 'pending'
           AND locked_submission.status IN ('pending', 'in_review')
           AND locked_notification.payload ->> 'expected_review_version' = locked_submission.review_version::text
           AND locked_submission.claim_expires_at > now() THEN
            CONTINUE;
        END IF;

        IF locked_notification.attempt_count >= 8 THEN
            UPDATE public.app_review_notification
            SET status = 'dead_letter',
                locked_at = NULL,
                locked_by = NULL,
                next_attempt_at = now(),
                payload = payload - 'provider_send_fence',
                last_error = COALESCE(
                    locked_notification.last_error,
                    'Worker lease expired after the final delivery attempt.'
                )
            WHERE id = locked_notification.id
            RETURNING * INTO locked_notification;

            INSERT INTO public.app_review_event (
                submission_id,
                event_type,
                review_version,
                payload
            )
            VALUES (
                locked_submission.id,
                'notification_dead_lettered',
                locked_submission.review_version,
                jsonb_build_object(
                    'notification_id', locked_notification.id,
                    'notification_type', locked_notification.notification_type,
                    'channel', locked_notification.channel,
                    'attempt_count', locked_notification.attempt_count,
                    'reason', 'worker_lease_expired'
                )
            );
            CONTINUE;
        END IF;

        UPDATE public.app_review_notification
        SET status = 'processing',
            attempt_count = locked_notification.attempt_count + 1,
            locked_at = now(),
            locked_by = p_worker_id,
            last_attempt_at = now(),
            delivered_at = NULL,
            payload = payload - 'provider_send_fence'
        WHERE id = locked_notification.id
        RETURNING * INTO claimed_notification;

        INSERT INTO public.app_review_event (
            submission_id,
            event_type,
            review_version,
            payload
        )
        VALUES (
            claimed_notification.submission_id,
            'notification_attempted',
            locked_submission.review_version,
            jsonb_build_object(
                'notification_id', claimed_notification.id,
                'notification_type', claimed_notification.notification_type,
                'channel', claimed_notification.channel,
                'attempt_count', claimed_notification.attempt_count,
                'worker_id', p_worker_id
            )
        );

        IF claimed_notification.channel = 'publication' THEN
            INSERT INTO public.app_review_event (
                submission_id,
                event_type,
                review_version,
                payload
            )
            VALUES (
                claimed_notification.submission_id,
                'publication_check_pending',
                locked_submission.review_version,
                jsonb_build_object(
                    'notification_id', claimed_notification.id,
                    'attempt_count', claimed_notification.attempt_count
                )
            );
        END IF;

        claimed_count := claimed_count + 1;
        RETURN NEXT claimed_notification;
    END LOOP;
END;
$$;

CREATE FUNCTION public.reviewer_complete_app_review_notification(
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
    observed_submission_id uuid;
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

    SELECT candidate.submission_id
    INTO observed_submission_id
    FROM public.app_review_notification AS candidate
    WHERE candidate.id = p_notification_id;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    SELECT candidate.*
    INTO submission
    FROM public.app_review_submission AS candidate
    WHERE candidate.id = observed_submission_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    SELECT candidate.*
    INTO notification
    FROM public.app_review_notification AS candidate
    WHERE candidate.id = p_notification_id
      AND candidate.submission_id = submission.id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    IF notification.status = 'delivered'
       AND p_outcome = 'delivered'
       AND notification.provider_message_id IS NOT DISTINCT FROM
           NULLIF(btrim(COALESCE(p_provider_message_id, '')), '') THEN
        RETURN NEXT notification;
        RETURN;
    END IF;

    -- The delivery helper checks this immediately before the provider call;
    -- repeat it transactionally during finalization as defense in depth.
    IF notification.notification_type = 'submission_received'
       AND notification.channel = 'slack'
       AND submission.status = 'withdrawn' THEN
        PERFORM public.cancel_app_review_submission_received_notification(
            submission.id,
            'system:notification-terminal-reconciliation',
            'submission_withdrawn',
            'Cancelled because the review is no longer active.'
        );
        SELECT candidate.*
        INTO notification
        FROM public.app_review_notification AS candidate
        WHERE candidate.id = p_notification_id;
        IF FOUND THEN
            RETURN NEXT notification;
        END IF;
        RETURN;
    END IF;

    IF notification.status IS DISTINCT FROM 'processing'
       OR notification.locked_by IS DISTINCT FROM p_worker_id
       OR NOT (notification.locked_at > now() - interval '5 minutes') THEN
        RETURN;
    END IF;

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
            locked_by = NULL,
            payload = payload - 'provider_send_fence'
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
            locked_by = NULL,
            payload = payload - 'provider_send_fence'
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
            locked_by = NULL,
            payload = CASE
                -- A transport error after chat.postMessage began is
                -- ambiguous. Preserve the bounded fence so withdrawal cannot
                -- commit before Slack has stopped accepting that request.
                WHEN notification.notification_type = 'submission_received'
                 AND notification.channel = 'slack'
                    THEN payload
                ELSE payload - 'provider_send_fence'
            END
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

CREATE FUNCTION public.reviewer_retry_app_review_notification(
    p_notification_id uuid,
    p_operation_id uuid,
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
    observed_submission_id uuid;
    notification public.app_review_notification%ROWTYPE;
    submission public.app_review_submission%ROWTYPE;
    previous_status text;
    previous_error text;
    fence_expires_at timestamptz;
BEGIN
    IF p_operation_id IS NULL
       OR btrim(COALESCE(p_actor_subject, '')) = ''
       OR btrim(COALESCE(p_actor_email, '')) = '' THEN
        RETURN;
    END IF;

    SELECT candidate.submission_id
    INTO observed_submission_id
    FROM public.app_review_notification AS candidate
    WHERE candidate.id = p_notification_id;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    SELECT candidate.*
    INTO submission
    FROM public.app_review_submission AS candidate
    WHERE candidate.id = observed_submission_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    SELECT candidate.*
    INTO notification
    FROM public.app_review_notification AS candidate
    WHERE candidate.id = p_notification_id
      AND candidate.submission_id = submission.id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.app_review_event AS event
        WHERE event.submission_id = notification.submission_id
          AND event.event_type = 'notification_retry_requested'
          AND event.actor_subject = p_actor_subject
          AND event.payload @> jsonb_build_object(
              'notification_id', notification.id,
              'operation_id', p_operation_id
          )
    ) THEN
        RETURN NEXT notification;
        RETURN;
    END IF;

    IF notification.status NOT IN ('failed', 'dead_letter')
       OR notification.manual_retry_blocked THEN
        RETURN;
    END IF;

    BEGIN
        fence_expires_at := NULLIF(
            notification.payload #>> '{provider_send_fence,expires_at}',
            ''
        )::timestamptz;
    EXCEPTION WHEN invalid_datetime_format OR datetime_field_overflow THEN
        fence_expires_at := NULL;
    END;

    -- A failed Slack response can still be accepted by the provider. Do not
    -- let a manual retry bypass the same ambiguity fence as withdrawal.
    IF NULLIF(notification.payload #>> '{provider_send_fence,token}', '') IS NOT NULL
       AND fence_expires_at > clock_timestamp() THEN
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
        last_error = NULL,
        payload = payload - 'provider_send_fence'
    WHERE id = notification.id
    RETURNING * INTO notification;

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
            'previous_error', previous_error,
            'operation_id', p_operation_id
        )
    );

    RETURN NEXT notification;
END;
$$;

-- Close the rollout window for rows made terminal by older application code.
DO $$
DECLARE
    reconciled_count integer;
BEGIN
    LOOP
        reconciled_count := public.reconcile_terminal_app_review_submission_notifications(500);
        EXIT WHEN reconciled_count = 0;
    END LOOP;
END;
$$;

COMMENT ON FUNCTION public.cancel_app_review_submission_received_notification(uuid, text, text, text) IS
'Atomically cancels undelivered submission Slack work for a withdrawn review and records the cancellation.';
COMMENT ON FUNCTION public.reviewer_begin_app_review_submission_slack_delivery(uuid, text, uuid) IS
'Service-only exact-claim pre-send fence; terminal transitions retry while the bounded provider send is live.';
COMMENT ON FUNCTION public.reconcile_terminal_app_review_submission_notifications(integer) IS
'Idempotently cancels undelivered submission Slack work left behind by older withdrawal transitions.';
COMMENT ON FUNCTION public.reviewer_claim_app_review_notifications(text, integer) IS
'Service-only submission-first durable outbox claim that excludes withdrawn submission alerts.';
COMMENT ON FUNCTION public.reviewer_complete_app_review_notification(uuid, text, text, text, text) IS
'Service-only submission-first completion that cannot revive a cancelled terminal submission alert.';
COMMENT ON FUNCTION public.reviewer_retry_app_review_notification(uuid, uuid, text, text) IS
'Idempotent submission-first manual retry; cancelled or provider-ambiguous Slack work cannot be requeued.';
