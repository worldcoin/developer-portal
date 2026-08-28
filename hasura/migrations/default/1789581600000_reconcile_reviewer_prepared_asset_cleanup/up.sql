CREATE OR REPLACE FUNCTION public.reviewer_reconcile_app_review_asset_cleanup(
    p_notification_id uuid,
    p_submission_id uuid,
    p_decision_fingerprint text,
    p_operation_id text,
    p_expected_review_version integer,
    p_app_metadata_id text,
    p_asset_keys jsonb,
    p_worker_id text
)
RETURNS SETOF public.app_review_notification
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
DECLARE
    submitted_metadata public.app_metadata%ROWTYPE;
    reviewed_app public.app%ROWTYPE;
    submission public.app_review_submission%ROWTYPE;
    cleanup_notification public.app_review_notification%ROWTYPE;
    derived_settlement_state text;
    prepared_filename_prefix text;
BEGIN
    IF p_notification_id IS NULL
       OR p_submission_id IS NULL
       OR p_decision_fingerprint IS NULL
       OR p_decision_fingerprint !~ '^[a-f0-9]{64}$'
       OR p_operation_id IS NULL
       OR p_operation_id !~ '^[a-f0-9]{16,64}$'
       OR p_expected_review_version IS NULL
       OR p_expected_review_version <= 0
       OR p_app_metadata_id IS NULL
       OR p_app_metadata_id !~ '^[A-Za-z0-9_-]+$'
       OR p_asset_keys IS NULL
       OR jsonb_typeof(p_asset_keys) <> 'array'
       OR jsonb_array_length(p_asset_keys) = 0
       OR jsonb_array_length(p_asset_keys) > 1000
       OR btrim(COALESCE(p_worker_id, '')) = ''
       OR char_length(p_worker_id) > 128 THEN
        RETURN;
    END IF;

    -- This is the same leading lock sequence as the decision transaction. A
    -- cleanup worker therefore observes the result of any decision that has
    -- already begun instead of deriving ownership from an expired wall clock.
    PERFORM pg_advisory_xact_lock(hashtextextended(p_app_metadata_id, 0));

    SELECT candidate.*
    INTO submitted_metadata
    FROM public.app_metadata AS candidate
    WHERE candidate.id = p_app_metadata_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    SELECT candidate.*
    INTO reviewed_app
    FROM public.app AS candidate
    WHERE candidate.id = submitted_metadata.app_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    prepared_filename_prefix :=
        'review_' || p_app_metadata_id || '_' || p_operation_id || '_';

    IF EXISTS (
        SELECT 1
        FROM jsonb_array_elements_text(p_asset_keys) AS asset_key(value)
        CROSS JOIN LATERAL (
            SELECT CASE array_length(string_to_array(asset_key.value, '/'), 1)
                WHEN 3 THEN split_part(asset_key.value, '/', 3)
                WHEN 4 THEN split_part(asset_key.value, '/', 4)
                ELSE NULL
            END AS prepared_filename
        ) AS parsed_asset
        WHERE asset_key.value !~ '^verified/[A-Za-z0-9_-]+/([A-Za-z0-9_-]+/)?[A-Za-z0-9_-]+\.(png|jpg)$'
           OR split_part(asset_key.value, '/', 2) IS DISTINCT FROM reviewed_app.id
           OR left(
               parsed_asset.prepared_filename,
               char_length(prepared_filename_prefix)
           ) IS DISTINCT FROM prepared_filename_prefix
    ) OR (
        SELECT count(*) <> count(DISTINCT asset_key.value)
        FROM jsonb_array_elements_text(p_asset_keys) AS asset_key(value)
    ) THEN
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

    SELECT candidate.*
    INTO cleanup_notification
    FROM public.app_review_notification AS candidate
    WHERE candidate.id = p_notification_id
      AND candidate.submission_id = p_submission_id
      AND candidate.notification_type = 'asset_cleanup'
      AND candidate.channel = 'asset'
      AND candidate.payload ->> 'cleanup_kind' = 'prepared_operation_settlement'
    FOR UPDATE;

    IF NOT FOUND
       OR cleanup_notification.status IS DISTINCT FROM 'processing'
       OR cleanup_notification.locked_by IS DISTINCT FROM p_worker_id
       OR cleanup_notification.payload ->> 'decision_fingerprint' IS DISTINCT FROM p_decision_fingerprint
       OR cleanup_notification.payload ->> 'operation_id' IS DISTINCT FROM p_operation_id
       OR cleanup_notification.payload ->> 'expected_review_version' IS DISTINCT FROM p_expected_review_version::text
       OR cleanup_notification.payload ->> 'app_metadata_id' IS DISTINCT FROM p_app_metadata_id
       OR cleanup_notification.payload -> 'asset_keys' IS DISTINCT FROM p_asset_keys THEN
        RETURN;
    END IF;

    derived_settlement_state := cleanup_notification.payload ->> 'settlement_state';
    IF derived_settlement_state IN ('committed', 'aborted') THEN
        RETURN NEXT cleanup_notification;
        RETURN;
    END IF;
    IF derived_settlement_state IS DISTINCT FROM 'pending' THEN
        RETURN;
    END IF;

    IF submission.status = 'approved'
       AND submission.review_version = p_expected_review_version + 1
       AND submission.app_metadata_id = p_app_metadata_id
       AND submission.app_id = reviewed_app.id
       AND submission.decision_fingerprint = p_decision_fingerprint
       AND submission.decision_result ->> 'decision' = 'approved'
       AND submission.decision_result ->> 'app_metadata_id' = p_app_metadata_id
       AND submission.decision_result -> 'prepared_asset_keys' = p_asset_keys THEN
        derived_settlement_state := 'committed';
    ELSIF submission.status IS DISTINCT FROM 'in_review'
       OR submission.review_version IS DISTINCT FROM p_expected_review_version
       OR submission.app_metadata_id IS DISTINCT FROM p_app_metadata_id
       OR submission.app_id IS DISTINCT FROM reviewed_app.id
       OR submitted_metadata.verification_status IS DISTINCT FROM 'awaiting_review'
       OR submission.claim_expires_at IS NULL
       OR clock_timestamp() >= submission.claim_expires_at THEN
        derived_settlement_state := 'aborted';
    ELSE
        derived_settlement_state := 'pending';
    END IF;

    IF derived_settlement_state <> 'pending' THEN
        UPDATE public.app_review_notification
        SET payload = payload || jsonb_build_object(
                'settlement_state', derived_settlement_state,
                'reconciled_at', clock_timestamp(),
                'reconciled_by_worker', p_worker_id
            )
        WHERE id = cleanup_notification.id
          AND status = 'processing'
          AND locked_by = p_worker_id
        RETURNING * INTO cleanup_notification;

        IF NOT FOUND THEN
            RETURN;
        END IF;
    END IF;

    RETURN NEXT cleanup_notification;
END;
$$;

CREATE OR REPLACE FUNCTION public.guard_aborted_app_review_asset_cleanup_decision()
RETURNS trigger
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
DECLARE
    aborted_notification_id uuid;
BEGIN
    IF OLD.status = 'in_review' AND NEW.status = 'approved' THEN
        SELECT candidate.id
        INTO aborted_notification_id
        FROM public.app_review_notification AS candidate
        WHERE candidate.submission_id = OLD.id
          AND candidate.notification_type = 'asset_cleanup'
          AND candidate.channel = 'asset'
          AND candidate.payload ->> 'cleanup_kind' = 'prepared_operation_settlement'
          AND candidate.payload ->> 'decision_fingerprint' = NEW.decision_fingerprint
          AND candidate.payload ->> 'expected_review_version' = OLD.review_version::text
          AND candidate.payload ->> 'app_metadata_id' = OLD.app_metadata_id
          AND candidate.payload -> 'asset_keys' = NEW.decision_result -> 'prepared_asset_keys'
          AND candidate.payload ->> 'settlement_state' = 'aborted'
        ORDER BY candidate.id
        LIMIT 1
        FOR UPDATE;

        IF FOUND THEN
            RAISE EXCEPTION USING
                ERRCODE = '55000',
                MESSAGE = 'The exact prepared reviewer asset plan was already aborted.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER guard_aborted_app_review_asset_cleanup_decision
BEFORE UPDATE OF status, decision_fingerprint, decision_result
ON public.app_review_submission
FOR EACH ROW
EXECUTE FUNCTION public.guard_aborted_app_review_asset_cleanup_decision();
