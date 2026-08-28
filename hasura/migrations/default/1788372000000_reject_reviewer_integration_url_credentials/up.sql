CREATE FUNCTION public.is_valid_reviewer_integration_url(p_url text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
PARALLEL SAFE
SET search_path = pg_catalog, public
AS $$
DECLARE
    authority text;
    host text;
    port_text text;
BEGIN
    IF p_url IS NULL
       OR p_url !~* '^https://'
       OR p_url ~ '[[:space:][:cntrl:]]'
       OR position(chr(92) IN p_url) > 0
       OR length(p_url) > 2048 THEN
        RETURN false;
    END IF;

    authority := substring(substring(p_url FROM 9) FROM '^([^/?#]+)');
    IF authority IS NULL OR authority = '' OR position('@' IN authority) > 0 THEN
        RETURN false;
    END IF;

    IF authority ~ '^\[' THEN
        IF authority !~* '^\[[0-9a-f:.]+\](?::[0-9]{1,5})?$' THEN
            RETURN false;
        END IF;
        host := substring(authority FROM '^\[([^]]+)\]');
        port_text := substring(authority FROM '\]:([0-9]+)$');
        BEGIN
            PERFORM host::inet;
        EXCEPTION WHEN invalid_text_representation THEN
            RETURN false;
        END;
    ELSE
        IF authority !~* '^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*\.?(?::[0-9]{1,5})?$' THEN
            RETURN false;
        END IF;
        port_text := substring(authority FROM ':([0-9]+)$');
    END IF;

    IF port_text IS NOT NULL AND port_text::integer > 65535 THEN
        RETURN false;
    END IF;

    RETURN true;
END;
$$;

ALTER TABLE public.app_review_notification
ADD COLUMN manual_retry_blocked boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.app_review_notification.manual_retry_blocked IS
'True for workflow-cancelled outbox rows that a reviewer must not requeue.';

-- Keep the Hasura-facing capture signature stable while adding a validation
-- fence around the asset-snapshot implementation from the preceding migration.
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
RENAME TO capture_listing_review_submission_without_url_credentials_guard;

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
    metadata_integration_url text;
    metadata_app_id text;
    reviewed_app_is_banned boolean;
BEGIN
    -- Serialize with the inner capture operation, then hold the exact metadata
    -- row through validation and capture so the URL cannot change in between.
    PERFORM pg_advisory_xact_lock(hashtextextended(p_app_metadata_id, 0));

    SELECT candidate.integration_url, candidate.app_id
    INTO metadata_integration_url, metadata_app_id
    FROM public.app_metadata AS candidate
    WHERE candidate.id = p_app_metadata_id
    FOR UPDATE;

    IF FOUND THEN
        SELECT candidate.is_banned
        INTO reviewed_app_is_banned
        FROM public.app AS candidate
        WHERE candidate.id = metadata_app_id
        FOR UPDATE;

        IF NOT FOUND OR reviewed_app_is_banned IS DISTINCT FROM false THEN
            RAISE EXCEPTION 'Banned apps cannot be submitted for listing review.';
        END IF;
    END IF;

    IF FOUND AND NOT public.is_valid_reviewer_integration_url(metadata_integration_url) THEN
        IF metadata_integration_url ~* '^https://([^/?#@:]+(:[^/?#@]*)?|:[^/?#@]+)@' THEN
            RAISE EXCEPTION 'Integration URL must not include credentials.';
        END IF;
        RAISE EXCEPTION 'Integration URL must be a valid HTTPS URL.';
    END IF;

    RETURN QUERY
    SELECT captured.*
    FROM public.capture_listing_review_submission_without_url_credentials_guard(
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

-- The original workflow migration seeded already-awaiting listing rows before
-- the HTTPS and credential fences existed. Return invalid seeds to an editable
-- draft state, withdraw their review attempts, and stop any queued delivery so
-- they cannot be approved through the schema-first rollout window.
DO $$
DECLARE
    invalid_submission record;
    cancelled_notification record;
    withdrawn_review_version integer;
    previous_workflow_bypass text := current_setting('reviewer.workflow_bypass', true);
BEGIN
    PERFORM set_config('reviewer.workflow_bypass', 'on', true);

    FOR invalid_submission IN
        SELECT
            submission.id,
            submission.app_metadata_id,
            metadata.integration_url
        FROM public.app_review_submission AS submission
        INNER JOIN public.app_metadata AS metadata
            ON metadata.id = submission.app_metadata_id
        WHERE submission.status IN ('pending', 'in_review')
          AND metadata.verification_status = 'awaiting_review'
          AND NOT public.is_valid_reviewer_integration_url(metadata.integration_url)
        ORDER BY submission.id
    LOOP
        PERFORM pg_advisory_xact_lock(
            hashtextextended(invalid_submission.app_metadata_id, 0)
        );

        withdrawn_review_version := NULL;
        UPDATE public.app_review_submission AS submission
        SET status = 'withdrawn',
            review_version = submission.review_version + 1,
            claim_token = NULL,
            claimed_by_subject = NULL,
            claimed_by_email = NULL,
            claimed_at = NULL,
            claim_expires_at = NULL,
            completed_at = now()
        WHERE submission.id = invalid_submission.id
          AND submission.status IN ('pending', 'in_review')
          AND EXISTS (
              SELECT 1
              FROM public.app_metadata AS metadata
              WHERE metadata.id = submission.app_metadata_id
                AND metadata.verification_status = 'awaiting_review'
                AND NOT public.is_valid_reviewer_integration_url(metadata.integration_url)
          )
        RETURNING submission.review_version INTO withdrawn_review_version;

        IF withdrawn_review_version IS NULL THEN
            CONTINUE;
        END IF;

        UPDATE public.app_metadata
        SET verification_status = 'unverified'
        WHERE id = invalid_submission.app_metadata_id
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
            invalid_submission.id,
            'withdrawn',
            'system:invalid-integration-url-reconciliation',
            NULL,
            withdrawn_review_version,
            jsonb_build_object(
                'reason', 'invalid_integration_url',
                'integration_url', invalid_submission.integration_url,
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
                last_error = 'Cancelled because the submitted integration URL is invalid.',
                manual_retry_blocked = true,
                payload = payload || jsonb_build_object(
                    'cancellation_reason', 'invalid_integration_url'
                )
            WHERE submission_id = invalid_submission.id
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
                invalid_submission.id,
                'notification_dead_lettered',
                'system:invalid-integration-url-reconciliation',
                NULL,
                withdrawn_review_version,
                jsonb_build_object(
                    'notification_id', cancelled_notification.id,
                    'channel', cancelled_notification.channel,
                    'notification_type', cancelled_notification.notification_type,
                    'reason', 'invalid_integration_url'
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

CREATE FUNCTION public.guard_reviewer_approval_integration_url()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
    IF NEW.status = 'approved'
       AND (
           NOT public.is_valid_reviewer_integration_url(
               NEW.metadata_snapshot ->> 'integration_url'
           )
           OR NOT EXISTS (
               SELECT 1
               FROM public.app_metadata AS reviewed_metadata
               WHERE reviewed_metadata.id = NEW.app_metadata_id
                 AND reviewed_metadata.app_id = NEW.app_id
                 AND public.is_valid_reviewer_integration_url(
                     reviewed_metadata.integration_url
                 )
           )
       ) THEN
        RAISE EXCEPTION USING
            ERRCODE = '55000',
            MESSAGE = 'A review cannot be approved with an invalid integration URL.';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER guard_reviewer_approval_integration_url
BEFORE UPDATE OF status ON public.app_review_submission
FOR EACH ROW
EXECUTE FUNCTION public.guard_reviewer_approval_integration_url();
