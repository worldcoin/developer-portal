CREATE OR REPLACE FUNCTION public.capture_listing_review_submission(
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
    metadata public.app_metadata%ROWTYPE;
    app public.app%ROWTYPE;
    next_attempt integer;
    listing_target text;
    localizations_snapshot jsonb;
    captured_submission public.app_review_submission%ROWTYPE;
BEGIN
    -- Serialize all attempts for this immutable metadata id, including a
    -- resubmission that follows a committed withdrawal.
    PERFORM pg_advisory_xact_lock(hashtextextended(p_app_metadata_id, 0));

    SELECT candidate.*
    INTO metadata
    FROM public.app_metadata AS candidate
    WHERE candidate.id = p_app_metadata_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'App metadata not found.';
    END IF;

    SELECT candidate.*
    INTO app
    FROM public.app AS candidate
    WHERE candidate.id = metadata.app_id
    FOR UPDATE;

    IF NOT FOUND OR app.deleted_at IS NOT NULL THEN
        RAISE EXCEPTION 'App not found.';
    END IF;

    IF app.is_staging THEN
        RAISE EXCEPTION 'Staging apps cannot be submitted for review.';
    END IF;

    IF metadata.verification_status IS DISTINCT FROM 'unverified' THEN
        RAISE EXCEPTION 'Only unverified app metadata can be submitted.';
    END IF;

    IF metadata.app_mode IS NULL
       OR metadata.app_mode NOT IN ('mini-app', 'external') THEN
        RAISE EXCEPTION 'Only a Mini App or external integration can be submitted for listing review.';
    END IF;

    IF p_listing_consent IS NOT TRUE THEN
        RAISE EXCEPTION 'Listing consent is required for listing review.';
    END IF;

    IF metadata.integration_url IS NULL
       OR metadata.integration_url !~* '^https://[^[:space:]]+$' THEN
        RAISE EXCEPTION 'Integration URL must be a valid HTTPS URL.';
    END IF;

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
        WHERE localization.app_metadata_id = p_app_metadata_id
        ORDER BY localization.locale, localization.id
        FOR UPDATE
    ) AS locked_localization;

    -- The caller validates the complete metadata/localization shape using the
    -- portal schemas. Existing localization rows remain locked against updates
    -- and deletes until commit.
    -- The parent metadata row lock blocks new localization inserts through
    -- the child foreign-key key-share check.
    -- Reject a stale validation result while all of those locks are held.
    IF metadata.updated_at IS DISTINCT FROM p_expected_metadata_updated_at THEN
        RAISE EXCEPTION 'App metadata changed during submission. Please retry.';
    END IF;

    IF localizations_snapshot IS DISTINCT FROM p_expected_localizations_snapshot THEN
        RAISE EXCEPTION 'App localizations changed during submission. Please retry.';
    END IF;

    SELECT COALESCE(MAX(previous_submission.attempt), 0) + 1
    INTO next_attempt
    FROM public.app_review_submission AS previous_submission
    WHERE previous_submission.app_metadata_id = p_app_metadata_id;

    listing_target := CASE metadata.app_mode
        WHEN 'mini-app' THEN 'mini_app_store'
        ELSE 'world_ecosystem'
    END;

    UPDATE public.app_metadata
    SET verification_status = 'awaiting_review',
        is_developer_allow_listing = p_listing_consent,
        changelog = COALESCE(p_changelog, ''),
        review_message = '',
        reviewed_by = '',
        verified_at = NULL,
        is_row_verified = false,
        is_reviewer_app_store_approved = false,
        is_reviewer_world_app_approved = false
    WHERE id = p_app_metadata_id
    RETURNING * INTO metadata;

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
        metadata_updated_at,
        submitted_by_subject,
        submitted_by_email,
        metadata_snapshot,
        localizations_snapshot
    )
    VALUES (
        metadata.id,
        metadata.app_id,
        app.team_id,
        next_attempt,
        'pending',
        metadata.app_mode,
        listing_target,
        metadata.is_developer_allow_listing,
        COALESCE(p_changelog, ''),
        metadata.updated_at,
        p_submitted_by_subject,
        p_submitted_by_email,
        to_jsonb(metadata),
        localizations_snapshot
    )
    RETURNING * INTO captured_submission;

    INSERT INTO public.app_review_event (
        submission_id,
        event_type,
        actor_subject,
        actor_email,
        review_version,
        payload
    )
    VALUES (
        captured_submission.id,
        'submitted',
        p_submitted_by_subject,
        p_submitted_by_email,
        captured_submission.review_version,
        jsonb_build_object(
            'attempt', captured_submission.attempt,
            'app_mode', captured_submission.app_mode,
            'listing_target', captured_submission.listing_target
        )
    );

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

    RETURN NEXT captured_submission;
END;
$$;

CREATE OR REPLACE FUNCTION public.withdraw_listing_review_submission(
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
    metadata public.app_metadata%ROWTYPE;
    submission public.app_review_submission%ROWTYPE;
BEGIN
    PERFORM pg_advisory_xact_lock(hashtextextended(p_app_metadata_id, 0));

    SELECT candidate.*
    INTO metadata
    FROM public.app_metadata AS candidate
    WHERE candidate.id = p_app_metadata_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'App metadata not found.';
    END IF;

    IF metadata.verification_status IS NULL
       OR metadata.verification_status NOT IN ('awaiting_review', 'changes_requested') THEN
        RAISE EXCEPTION 'Only app metadata awaiting review or changes requested can be withdrawn.';
    END IF;

    UPDATE public.app_metadata
    SET verification_status = 'unverified'
    WHERE id = p_app_metadata_id;

    -- A changes-requested attempt is already terminal. Reopen the draft while
    -- preserving that decision and attribute the transition in its history.
    IF metadata.verification_status = 'changes_requested' THEN
        SELECT candidate.*
        INTO submission
        FROM public.app_review_submission AS candidate
        WHERE candidate.app_metadata_id = p_app_metadata_id
          AND candidate.status = 'changes_requested'
        ORDER BY candidate.attempt DESC
        LIMIT 1
        FOR UPDATE;

        IF FOUND THEN
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
                'draft_reopened',
                p_actor_subject,
                p_actor_email,
                submission.review_version,
                jsonb_build_object(
                    'metadata_status_from', 'changes_requested',
                    'metadata_status_to', 'unverified'
                )
            );
        END IF;

        RETURN;
    END IF;

    SELECT candidate.*
    INTO submission
    FROM public.app_review_submission AS candidate
    WHERE candidate.app_metadata_id = p_app_metadata_id
      AND candidate.status IN ('pending', 'in_review')
    ORDER BY candidate.attempt DESC
    LIMIT 1
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN;
    END IF;

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
    RETURNING * INTO submission;

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

    RETURN NEXT submission;
END;
$$;
