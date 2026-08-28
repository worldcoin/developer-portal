CREATE FUNCTION public.reconcile_uncaptured_listing_review_submission(
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
    PERFORM pg_advisory_xact_lock(hashtextextended(p_app_metadata_id, 0));

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

CREATE FUNCTION public.bridge_uncaptured_listing_review_submission()
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
        PERFORM public.reconcile_uncaptured_listing_review_submission(NEW.id);
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER bridge_uncaptured_listing_review_submission
AFTER INSERT OR UPDATE OF verification_status, is_developer_allow_listing, app_mode, integration_url
ON public.app_metadata
FOR EACH ROW
EXECUTE FUNCTION public.bridge_uncaptured_listing_review_submission();

-- Reconcile the rollout window between the original one-time backfill and
-- deployment of capture-aware application code. The function is idempotent,
-- so already-captured rows remain authoritative and unchanged.
SELECT public.reconcile_uncaptured_listing_review_submission(metadata.id)
FROM public.app_metadata AS metadata
INNER JOIN public.app AS reviewed_app
    ON reviewed_app.id = metadata.app_id
INNER JOIN public.team AS owning_team
    ON owning_team.id = reviewed_app.team_id
WHERE metadata.verification_status = 'awaiting_review'
  AND metadata.is_developer_allow_listing IS TRUE
  AND metadata.app_mode IN ('mini-app', 'external')
  AND public.is_valid_reviewer_integration_url(metadata.integration_url)
  AND reviewed_app.is_staging IS FALSE
  AND reviewed_app.is_banned IS FALSE
  AND reviewed_app.status = 'active'
  AND reviewed_app.is_archived IS FALSE
  AND reviewed_app.deleted_at IS NULL
  AND owning_team.deleted_at IS NULL
ORDER BY metadata.id;
