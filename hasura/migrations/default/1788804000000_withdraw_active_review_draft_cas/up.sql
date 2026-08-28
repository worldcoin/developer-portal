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

-- Keep the old signature available during a schema-first rollout, but prevent
-- old application code from withdrawing reviewer-managed listing attempts
-- without an observed version. Verification-only and native flows retain
-- their compatible legacy behavior until the application cutover completes.
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
    previous_workflow_bypass text := current_setting('reviewer.workflow_bypass', true);
    metadata public.app_metadata%ROWTYPE;
BEGIN
    PERFORM pg_advisory_xact_lock(hashtextextended(p_app_metadata_id, 0));

    SELECT candidate.*
    INTO metadata
    FROM public.app_metadata AS candidate
    WHERE candidate.id = p_app_metadata_id
    FOR UPDATE;

    IF FOUND
       AND metadata.app_mode IN ('mini-app', 'external')
       AND metadata.is_developer_allow_listing IS TRUE THEN
        RETURN;
    END IF;

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
