ALTER TABLE public.app_review_submission
ADD COLUMN "decision_fingerprint" text,
ADD COLUMN "decision_result" jsonb;

ALTER TABLE public.app_review_submission
ADD CONSTRAINT app_review_submission_decision_result_object
CHECK (
    decision_result IS NULL
    OR jsonb_typeof(decision_result) = 'object'
);

ALTER TABLE public.app_review_notification
DROP CONSTRAINT app_review_notification_type_check;

ALTER TABLE public.app_review_notification
ADD CONSTRAINT app_review_notification_type_check
CHECK (
    notification_type IN (
        'submission_received',
        'decision_approved',
        'decision_changes_requested',
        'publication_check',
        'asset_cleanup'
    )
);

ALTER TABLE public.app_review_notification
DROP CONSTRAINT app_review_notification_channel_check;

ALTER TABLE public.app_review_notification
ADD CONSTRAINT app_review_notification_channel_check
CHECK (channel IN ('slack', 'email', 'publication', 'asset'));

CREATE OR REPLACE FUNCTION public.reviewer_enqueue_app_review_asset_cleanup(
    p_submission_id uuid,
    p_decision_fingerprint text,
    p_operation_id text,
    p_expected_review_version integer,
    p_app_metadata_id text,
    p_asset_keys jsonb,
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
    submission public.app_review_submission%ROWTYPE;
    queued_notification public.app_review_notification%ROWTYPE;
    cleanup_dedupe_key text;
    prepared_filename_prefix text;
BEGIN
    IF p_decision_fingerprint IS NULL
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
       OR btrim(COALESCE(p_actor_subject, '')) = ''
       OR btrim(COALESCE(p_actor_email, '')) = '' THEN
        RETURN;
    END IF;

    SELECT candidate.*
    INTO submission
    FROM public.app_review_submission AS candidate
    WHERE candidate.id = p_submission_id
    FOR UPDATE;

    IF NOT FOUND
       OR submission.status IS DISTINCT FROM 'in_review'
       OR submission.review_version IS DISTINCT FROM p_expected_review_version
       OR submission.app_metadata_id IS DISTINCT FROM p_app_metadata_id
       OR submission.claimed_by_subject IS DISTINCT FROM p_actor_subject
       OR NOT (submission.claim_expires_at > now()) THEN
        RETURN;
    END IF;

    prepared_filename_prefix :=
        'review_' || submission.app_metadata_id || '_' || p_operation_id || '_';

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
           OR split_part(asset_key.value, '/', 2) IS DISTINCT FROM submission.app_id
           OR left(
               parsed_asset.prepared_filename,
               char_length(prepared_filename_prefix)
           ) IS DISTINCT FROM prepared_filename_prefix
    ) THEN
        RETURN;
    END IF;

    cleanup_dedupe_key :=
        'review-assets:' || submission.id::text || ':' || p_operation_id || ':settlement';

    INSERT INTO public.app_review_notification (
        submission_id,
        notification_type,
        channel,
        dedupe_key,
        payload,
        next_attempt_at
    )
    VALUES (
        submission.id,
        'asset_cleanup',
        'asset',
        cleanup_dedupe_key,
        jsonb_build_object(
            'cleanup_kind', 'prepared_operation_settlement',
            'submission_id', submission.id,
            'app_id', submission.app_id,
            'decision_fingerprint', p_decision_fingerprint,
            'operation_id', p_operation_id,
            'expected_review_version', p_expected_review_version,
            'app_metadata_id', p_app_metadata_id,
            'asset_keys', p_asset_keys,
            'settlement_state', 'pending',
            'registered_by_subject', p_actor_subject,
            'registered_by_email', p_actor_email
        ),
        now() + interval '2 minutes'
    )
    ON CONFLICT (dedupe_key) DO NOTHING
    RETURNING * INTO queued_notification;

    IF NOT FOUND THEN
        SELECT existing_notification.*
        INTO queued_notification
        FROM public.app_review_notification AS existing_notification
        WHERE existing_notification.dedupe_key = cleanup_dedupe_key
          AND existing_notification.payload ->> 'decision_fingerprint' = p_decision_fingerprint
          AND existing_notification.payload ->> 'operation_id' = p_operation_id
          AND existing_notification.payload ->> 'expected_review_version' = p_expected_review_version::text
          AND existing_notification.payload ->> 'app_metadata_id' = p_app_metadata_id
          AND existing_notification.payload -> 'asset_keys' = p_asset_keys;
    END IF;

    IF queued_notification.id IS NOT NULL THEN
        RETURN NEXT queued_notification;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.reviewer_settle_app_review_asset_cleanup(
    p_submission_id uuid,
    p_decision_fingerprint text,
    p_operation_id text,
    p_settlement_state text,
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
    cleanup_notification public.app_review_notification%ROWTYPE;
    cleanup_dedupe_key text;
BEGIN
    IF p_decision_fingerprint IS NULL
       OR p_decision_fingerprint !~ '^[a-f0-9]{64}$'
       OR p_operation_id IS NULL
       OR p_operation_id !~ '^[a-f0-9]{16,64}$'
       OR p_settlement_state IS NULL
       OR p_settlement_state NOT IN ('committed', 'aborted')
       OR btrim(COALESCE(p_actor_subject, '')) = ''
       OR btrim(COALESCE(p_actor_email, '')) = '' THEN
        RETURN;
    END IF;

    cleanup_dedupe_key :=
        'review-assets:' || p_submission_id::text || ':' || p_operation_id || ':settlement';

    SELECT candidate.*
    INTO cleanup_notification
    FROM public.app_review_notification AS candidate
    WHERE candidate.submission_id = p_submission_id
      AND candidate.notification_type = 'asset_cleanup'
      AND candidate.channel = 'asset'
      AND candidate.dedupe_key = cleanup_dedupe_key
      AND candidate.payload ->> 'cleanup_kind' = 'prepared_operation_settlement'
      AND candidate.payload ->> 'decision_fingerprint' = p_decision_fingerprint
      AND candidate.payload ->> 'operation_id' = p_operation_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    IF cleanup_notification.payload ->> 'settlement_state' = p_settlement_state THEN
        RETURN NEXT cleanup_notification;
        RETURN;
    END IF;

    IF cleanup_notification.payload ->> 'settlement_state' IS DISTINCT FROM 'pending'
       OR cleanup_notification.status NOT IN ('pending', 'failed') THEN
        RETURN;
    END IF;

    UPDATE public.app_review_notification
    SET payload = payload || jsonb_build_object(
            'settlement_state', p_settlement_state,
            'settled_at', now(),
            'settled_by_subject', p_actor_subject,
            'settled_by_email', p_actor_email
        ),
        next_attempt_at = LEAST(next_attempt_at, now())
    WHERE id = cleanup_notification.id
    RETURNING * INTO cleanup_notification;

    RETURN NEXT cleanup_notification;
END;
$$;

-- Keep applied migration history immutable: rename the Task 3 operations and
-- install same-signature wrappers that enable the narrow transaction-local
-- guard bypass before delegating to their original bodies.
ALTER FUNCTION public.capture_listing_review_submission(
    text,
    text,
    text,
    text,
    boolean,
    timestamptz,
    jsonb
) RENAME TO capture_listing_review_submission_without_reviewer_bypass;

CREATE FUNCTION public.capture_listing_review_submission(
    p_app_metadata_id text,
    p_changelog text,
    p_submitted_by_subject text,
    p_submitted_by_email text,
    p_listing_consent boolean,
    p_expected_metadata_updated_at timestamptz,
    p_expected_localizations_snapshot jsonb
)
RETURNS SETOF public.app_review_submission
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
DECLARE
    previous_workflow_bypass text := current_setting('reviewer.workflow_bypass', true);
BEGIN
    PERFORM set_config('reviewer.workflow_bypass', 'on', true);
    BEGIN
        RETURN QUERY
        SELECT *
        FROM public.capture_listing_review_submission_without_reviewer_bypass(
            p_app_metadata_id,
            p_changelog,
            p_submitted_by_subject,
            p_submitted_by_email,
            p_listing_consent,
            p_expected_metadata_updated_at,
            p_expected_localizations_snapshot
        );
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
END;
$$;

ALTER FUNCTION public.withdraw_listing_review_submission(text, text, text)
RENAME TO withdraw_listing_review_submission_without_reviewer_bypass;

CREATE FUNCTION public.withdraw_listing_review_submission(
    p_app_metadata_id text,
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
    previous_workflow_bypass text := current_setting('reviewer.workflow_bypass', true);
BEGIN
    PERFORM set_config('reviewer.workflow_bypass', 'on', true);
    BEGIN
        RETURN QUERY
        SELECT *
        FROM public.withdraw_listing_review_submission_without_reviewer_bypass(
            p_app_metadata_id,
            p_actor_subject,
            p_actor_email
        );
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
END;
$$;

CREATE OR REPLACE FUNCTION public.guard_active_app_review_metadata_write()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
DECLARE
    guarded_old_app_id text;
    guarded_new_app_id text;
BEGIN
    IF current_setting('reviewer.workflow_bypass', true) = 'on' THEN
        IF TG_OP = 'DELETE' THEN
            RETURN OLD;
        END IF;
        RETURN NEW;
    END IF;

    guarded_old_app_id := CASE
        WHEN TG_OP = 'INSERT' THEN NULL
        ELSE OLD.app_id
    END;
    guarded_new_app_id := CASE
        WHEN TG_OP = 'DELETE' THEN NULL
        ELSE NEW.app_id
    END;

    IF EXISTS (
        SELECT 1
        FROM public.app_review_submission AS active_submission
        WHERE active_submission.app_id IN (
                guarded_old_app_id,
                guarded_new_app_id
            )
          AND active_submission.status IN ('pending', 'in_review')
    ) THEN
        RAISE EXCEPTION USING
            ERRCODE = '55000',
            MESSAGE = 'Active listing reviews must be changed through the reviewer workflow.';
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.guard_active_app_review_localization_write()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
DECLARE
    guarded_old_metadata_id text;
    guarded_new_metadata_id text;
BEGIN
    IF current_setting('reviewer.workflow_bypass', true) = 'on' THEN
        IF TG_OP = 'DELETE' THEN
            RETURN OLD;
        END IF;
        RETURN NEW;
    END IF;

    guarded_old_metadata_id := CASE
        WHEN TG_OP = 'INSERT' THEN NULL
        ELSE OLD.app_metadata_id
    END;
    guarded_new_metadata_id := CASE
        WHEN TG_OP = 'DELETE' THEN NULL
        ELSE NEW.app_metadata_id
    END;

    IF EXISTS (
        SELECT 1
        FROM public.app_metadata AS guarded_metadata
        INNER JOIN public.app_review_submission AS active_submission
            ON active_submission.app_id = guarded_metadata.app_id
        WHERE guarded_metadata.id IN (
                guarded_old_metadata_id,
                guarded_new_metadata_id
            )
          AND active_submission.status IN ('pending', 'in_review')
    ) THEN
        RAISE EXCEPTION USING
            ERRCODE = '55000',
            MESSAGE = 'Active listing review localizations must be changed through the reviewer workflow.';
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER guard_active_app_review_metadata_write
BEFORE INSERT OR UPDATE OR DELETE ON public.app_metadata
FOR EACH ROW
EXECUTE FUNCTION public.guard_active_app_review_metadata_write();

CREATE TRIGGER guard_active_app_review_localization_write
BEFORE INSERT OR UPDATE OR DELETE ON public.localisations
FOR EACH ROW
EXECUTE FUNCTION public.guard_active_app_review_localization_write();

CREATE OR REPLACE FUNCTION public.reviewer_decide_app_review_submission(
    p_submission_id uuid,
    p_claim_token uuid,
    p_expected_review_version integer,
    p_app_metadata_id text,
    p_expected_metadata_updated_at timestamptz,
    p_decision text,
    p_developer_message text,
    p_override_reason text,
    p_decision_fingerprint text,
    p_expected_prior_verified_id text,
    p_expected_prior_verified_updated_at timestamptz,
    p_expected_prior_localizations_snapshot jsonb,
    p_metadata_assets jsonb,
    p_localization_assets jsonb,
    p_prepared_asset_keys jsonb,
    p_old_asset_keys jsonb,
    p_failed_checks jsonb,
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
    submitted_metadata public.app_metadata%ROWTYPE;
    reviewed_app public.app%ROWTYPE;
    prior_verified_metadata public.app_metadata%ROWTYPE;
    submission public.app_review_submission%ROWTYPE;
    decided_submission public.app_review_submission%ROWTYPE;
    current_localizations_snapshot jsonb;
    current_prior_localizations_snapshot jsonb;
    prior_verified_found boolean := false;
    affected_rows integer := 0;
    target_status text;
    decision_notification_type text;
    localization_update record;
    previous_workflow_bypass text := current_setting('reviewer.workflow_bypass', true);
BEGIN
    IF p_decision IS NULL
       OR p_decision NOT IN ('approved', 'changes_requested')
       OR p_decision_fingerprint IS NULL
       OR p_decision_fingerprint !~ '^[a-f0-9]{64}$'
       OR p_metadata_assets IS NULL
       OR jsonb_typeof(p_metadata_assets) <> 'object'
       OR p_localization_assets IS NULL
       OR jsonb_typeof(p_localization_assets) <> 'object'
       OR p_prepared_asset_keys IS NULL
       OR jsonb_typeof(p_prepared_asset_keys) <> 'array'
       OR p_old_asset_keys IS NULL
       OR jsonb_typeof(p_old_asset_keys) <> 'array'
       OR p_failed_checks IS NULL
       OR jsonb_typeof(p_failed_checks) <> 'array'
       OR (p_decision = 'changes_requested' AND btrim(COALESCE(p_developer_message, '')) = '') THEN
        RETURN;
    END IF;

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

    SELECT prior_verified.*
    INTO prior_verified_metadata
    FROM public.app_metadata AS prior_verified
    WHERE prior_verified.app_id = reviewed_app.id
      AND prior_verified.id <> p_app_metadata_id
      AND prior_verified.verification_status = 'verified'
    ORDER BY prior_verified.id
    LIMIT 1
    FOR UPDATE;
    prior_verified_found := FOUND;

    SELECT COALESCE(
        jsonb_agg(
            to_jsonb(locked_prior_localization)
            ORDER BY locked_prior_localization.locale, locked_prior_localization.id
        ),
        '[]'::jsonb
    )
    INTO current_prior_localizations_snapshot
    FROM (
        SELECT prior_localization.*
        FROM public.localisations AS prior_localization
        WHERE prior_localization.app_metadata_id = prior_verified_metadata.id
        ORDER BY prior_localization.locale, prior_localization.id
        FOR UPDATE
    ) AS locked_prior_localization;

    SELECT COALESCE(
        jsonb_agg(
            to_jsonb(locked_localization)
            ORDER BY locked_localization.locale, locked_localization.id
        ),
        '[]'::jsonb
    )
    INTO current_localizations_snapshot
    FROM (
        SELECT localization.*
        FROM public.localisations AS localization
        WHERE localization.app_metadata_id = p_app_metadata_id
        ORDER BY localization.locale, localization.id
        FOR UPDATE
    ) AS locked_localization;

    SELECT candidate.*
    INTO submission
    FROM public.app_review_submission AS candidate
    WHERE candidate.id = p_submission_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    -- A retry of the exact committed request is a read of the durable result.
    -- A different actor or request fingerprint cannot add another event/outbox.
    IF submission.status IN ('approved', 'changes_requested') THEN
        IF submission.decision_fingerprint = p_decision_fingerprint
           AND submission.decided_by_subject = p_actor_subject
           AND submission.decision_result ->> 'decision' = p_decision THEN
            RETURN NEXT submission;
        END IF;
        RETURN;
    END IF;

    IF submission.status IS DISTINCT FROM 'in_review'
       OR submission.review_version = p_expected_review_version IS NOT TRUE
       OR submission.claim_token = p_claim_token IS NOT TRUE
       OR submission.claimed_by_subject = p_actor_subject IS NOT TRUE
       OR NOT (submission.claim_expires_at > now())
       OR submission.app_metadata_id IS DISTINCT FROM p_app_metadata_id
       OR submission.app_id IS DISTINCT FROM reviewed_app.id
       OR submitted_metadata.id = p_app_metadata_id IS NOT TRUE
       OR submitted_metadata.app_id IS DISTINCT FROM submission.app_id
       OR submitted_metadata.updated_at IS DISTINCT FROM p_expected_metadata_updated_at
       OR submission.metadata_updated_at IS DISTINCT FROM p_expected_metadata_updated_at
       OR submitted_metadata.verification_status IS DISTINCT FROM 'awaiting_review'
       OR submitted_metadata.app_mode IS DISTINCT FROM submission.app_mode
       OR submitted_metadata.is_developer_allow_listing IS NOT TRUE
       OR submission.listing_consent IS NOT TRUE
       OR submission.app_mode NOT IN ('mini-app', 'external')
       OR reviewed_app.deleted_at IS NOT NULL
       OR reviewed_app.is_staging
       OR current_localizations_snapshot IS DISTINCT FROM submission.localizations_snapshot
       OR submission.checklist_version IS NULL
       OR jsonb_typeof(submission.checklist -> 'definitionSnapshot') <> 'object' THEN
        RETURN;
    END IF;

    IF p_decision = 'approved' THEN
        IF prior_verified_found IS DISTINCT FROM (p_expected_prior_verified_id IS NOT NULL) THEN
            RETURN;
        END IF;
        IF prior_verified_found AND (
            prior_verified_metadata.id IS DISTINCT FROM p_expected_prior_verified_id
            OR prior_verified_metadata.updated_at IS DISTINCT FROM p_expected_prior_verified_updated_at
            OR current_prior_localizations_snapshot IS DISTINCT FROM p_expected_prior_localizations_snapshot
        ) THEN
            RETURN;
        END IF;

        IF (p_metadata_assets ->> 'logoImgUrl') !~ '^[A-Za-z0-9_-]+\.(png|jpg)$'
           OR EXISTS (
               SELECT 1
               FROM jsonb_array_elements_text(COALESCE(p_prepared_asset_keys, '[]'::jsonb)) AS prepared_key(value)
               WHERE prepared_key.value !~ '^verified/[A-Za-z0-9_-]+/(?:[A-Za-z0-9_-]+/)?[A-Za-z0-9_-]+\.(png|jpg)$'
                  OR split_part(prepared_key.value, '/', 2) IS DISTINCT FROM reviewed_app.id
           )
           OR EXISTS (
               SELECT 1
               FROM jsonb_array_elements_text(COALESCE(p_old_asset_keys, '[]'::jsonb)) AS old_key(value)
               WHERE old_key.value !~ '^verified/[A-Za-z0-9_-]+/(?:[A-Za-z0-9_-]+/)?[A-Za-z0-9_-]+\.(png|jpg|jpeg)$'
                  OR split_part(old_key.value, '/', 2) IS DISTINCT FROM reviewed_app.id
           ) THEN
            RETURN;
        END IF;
    END IF;

    PERFORM set_config('reviewer.workflow_bypass', 'on', true);

    IF p_decision = 'changes_requested' THEN
        UPDATE public.app_metadata
        SET verification_status = 'changes_requested',
            review_message = p_developer_message,
            reviewed_by = p_actor_email
        WHERE id = p_app_metadata_id
          AND updated_at = p_expected_metadata_updated_at
          AND verification_status = 'awaiting_review';

        GET DIAGNOSTICS affected_rows = ROW_COUNT;
        IF affected_rows <> 1 THEN
            RAISE EXCEPTION 'Exact submitted metadata changed during decision.';
        END IF;
    ELSE
        -- Approval deletes only the exact locked predecessor before promoting
        -- the submitted row in place, preserving its localization identities.
        IF prior_verified_found THEN
            DELETE FROM public.app_metadata
            WHERE id = p_expected_prior_verified_id
              AND updated_at = p_expected_prior_verified_updated_at
              AND verification_status = 'verified';

            GET DIAGNOSTICS affected_rows = ROW_COUNT;
            IF affected_rows <> 1 THEN
                RAISE EXCEPTION 'Exact prior verified metadata changed during decision.';
            END IF;
        END IF;

        UPDATE public.app_metadata
        SET logo_img_url = p_metadata_assets ->> 'logoImgUrl',
            hero_image_url = '',
            meta_tag_image_url = COALESCE(p_metadata_assets ->> 'metaTagImageUrl', ''),
            content_card_image_url = COALESCE(p_metadata_assets ->> 'contentCardImageUrl', ''),
            showcase_img_urls = CASE
                WHEN p_metadata_assets -> 'showcaseImgUrls' IS NULL
                  OR p_metadata_assets -> 'showcaseImgUrls' = 'null'::jsonb THEN NULL
                ELSE ARRAY(
                    SELECT jsonb_array_elements_text(p_metadata_assets -> 'showcaseImgUrls')
                )
            END,
            verification_status = 'verified',
            verified_at = now(),
            reviewed_by = p_actor_email,
            review_message = '',
            is_reviewer_world_app_approved = true,
            is_reviewer_app_store_approved = (submission.app_mode = 'mini-app')
        WHERE id = p_app_metadata_id
          AND updated_at = p_expected_metadata_updated_at
          AND verification_status = 'awaiting_review';

        GET DIAGNOSTICS affected_rows = ROW_COUNT;
        IF affected_rows <> 1 THEN
            RAISE EXCEPTION 'Exact submitted metadata changed during decision.';
        END IF;

        UPDATE public.localisations
        SET hero_image_url = '',
            meta_tag_image_url = '',
            showcase_img_urls = NULL
        WHERE app_metadata_id = p_app_metadata_id;

        FOR localization_update IN
            SELECT entry.key AS localization_id, entry.value AS assets
            FROM jsonb_each(p_localization_assets) AS entry
        LOOP
            UPDATE public.localisations
            SET meta_tag_image_url = COALESCE(localization_update.assets ->> 'metaTagImageUrl', ''),
                showcase_img_urls = CASE
                    WHEN localization_update.assets -> 'showcaseImgUrls' IS NULL
                      OR localization_update.assets -> 'showcaseImgUrls' = 'null'::jsonb THEN NULL
                    ELSE ARRAY(
                        SELECT jsonb_array_elements_text(localization_update.assets -> 'showcaseImgUrls')
                    )
                END
            WHERE id = localization_update.localization_id
              AND app_metadata_id = p_app_metadata_id;

            GET DIAGNOSTICS affected_rows = ROW_COUNT;
            IF affected_rows <> 1 THEN
                RAISE EXCEPTION 'Prepared localization no longer matches the submitted draft.';
            END IF;
        END LOOP;

        UPDATE public.app
        SET first_verified_at = COALESCE(first_verified_at, now())
        WHERE id = reviewed_app.id;
    END IF;

    target_status := CASE p_decision
        WHEN 'approved' THEN 'approved'
        ELSE 'changes_requested'
    END;
    decision_notification_type := CASE p_decision
        WHEN 'approved' THEN 'decision_approved'
        ELSE 'decision_changes_requested'
    END;

    UPDATE public.app_review_submission
    SET status = target_status,
        review_version = review_version + 1,
        claim_token = NULL,
        claimed_by_subject = NULL,
        claimed_by_email = NULL,
        claimed_at = NULL,
        claim_expires_at = NULL,
        decision_summary = p_developer_message,
        decision_fingerprint = p_decision_fingerprint,
        decision_result = jsonb_build_object(
            'decision', p_decision,
            'app_id', submission.app_id,
            'app_metadata_id', submission.app_metadata_id,
            'listing_target', submission.listing_target,
            'prepared_asset_keys', p_prepared_asset_keys,
            'checklist_version', submission.checklist_version,
            'checklist_definition_snapshot', submission.checklist -> 'definitionSnapshot'
        ),
        decided_by_subject = p_actor_subject,
        decided_by_email = p_actor_email,
        decided_at = now(),
        completed_at = now()
    WHERE id = submission.id
      AND review_version = p_expected_review_version
    RETURNING * INTO decided_submission;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Review version changed during decision.';
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
        decided_submission.id,
        p_decision,
        p_actor_subject,
        p_actor_email,
        decided_submission.review_version,
        jsonb_build_object(
            'decision', p_decision,
            'developer_message', p_developer_message,
            'failed_checks', p_failed_checks,
            'override_reason', NULLIF(btrim(COALESCE(p_override_reason, '')), ''),
            'checklist_version', decided_submission.checklist_version,
            'decision_fingerprint', p_decision_fingerprint
        )
    );

    INSERT INTO public.app_review_notification (
        submission_id,
        notification_type,
        channel,
        dedupe_key,
        recipient,
        payload
    )
    SELECT
        decided_submission.id,
        decision_notification_type,
        'email',
        'review-decision:' || decided_submission.id::text || ':' || p_decision || ':email:' || md5(recipient.email),
        recipient.email,
        jsonb_build_object(
            'submission_id', decided_submission.id,
            'app_id', decided_submission.app_id,
            'app_metadata_id', decided_submission.app_metadata_id,
            'team_id', decided_submission.team_id,
            'decision', p_decision,
            'developer_message', p_developer_message,
            'failed_checks', p_failed_checks,
            'listing_target', decided_submission.listing_target
        )
    FROM (
        SELECT DISTINCT lower(btrim(team_user.email)) AS email
        FROM public.membership AS membership
        INNER JOIN public."user" AS team_user ON team_user.id = membership.user_id
        WHERE membership.team_id = decided_submission.team_id
          AND membership.role IN ('OWNER', 'ADMIN')
          AND btrim(team_user.email) <> ''
    ) AS recipient
    ON CONFLICT (dedupe_key) DO NOTHING;

    IF p_decision = 'approved' THEN
        INSERT INTO public.app_review_notification (
            submission_id,
            notification_type,
            channel,
            dedupe_key,
            payload
        )
        VALUES (
            decided_submission.id,
            'publication_check',
            'publication',
            'review-decision:' || decided_submission.id::text || ':publication_check',
            jsonb_build_object(
                'submission_id', decided_submission.id,
                'app_id', decided_submission.app_id,
                'app_metadata_id', decided_submission.app_metadata_id,
                'app_mode', decided_submission.app_mode,
                'listing_target', decided_submission.listing_target
            )
        )
        ON CONFLICT (dedupe_key) DO NOTHING;

        IF jsonb_array_length(p_old_asset_keys) > 0 THEN
            INSERT INTO public.app_review_notification (
                submission_id,
                notification_type,
                channel,
                dedupe_key,
                payload
            )
            VALUES (
                decided_submission.id,
                'asset_cleanup',
                'asset',
                'review-decision:' || decided_submission.id::text || ':asset_cleanup',
                jsonb_build_object(
                    'cleanup_kind', 'superseded_live_assets',
                    'asset_keys', p_old_asset_keys,
                    'old_asset_keys', p_old_asset_keys,
                    'prepared_asset_keys', p_prepared_asset_keys,
                    'decision_fingerprint', p_decision_fingerprint
                )
            )
            ON CONFLICT (dedupe_key) DO NOTHING;
        END IF;
    END IF;

    PERFORM set_config(
        'reviewer.workflow_bypass',
        COALESCE(previous_workflow_bypass, ''),
        true
    );
    RETURN NEXT decided_submission;
EXCEPTION WHEN OTHERS THEN
    PERFORM set_config(
        'reviewer.workflow_bypass',
        COALESCE(previous_workflow_bypass, ''),
        true
    );
    RAISE;
END;
$$;
