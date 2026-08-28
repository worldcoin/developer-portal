ALTER TABLE public.app_review_submission
ADD COLUMN asset_snapshot jsonb;

ALTER TABLE public.app_review_submission
ADD CONSTRAINT app_review_submission_asset_snapshot_object
CHECK (
    asset_snapshot IS NULL
    OR (
        jsonb_typeof(asset_snapshot) = 'object'
        AND asset_snapshot -> 'version' = '1'::jsonb
        AND jsonb_typeof(asset_snapshot -> 'prefix') = 'string'
        AND jsonb_typeof(asset_snapshot -> 'objects') = 'object'
    )
);

COMMENT ON COLUMN public.app_review_submission.asset_snapshot IS
'Immutable S3 object manifest captured for this review attempt. NULL is limited to legacy backfill rows, which must be repaired before approval.';

CREATE FUNCTION public.is_valid_reviewer_asset_snapshot(
    p_asset_snapshot jsonb,
    p_app_id text,
    p_app_metadata_id text,
    p_metadata_snapshot jsonb
)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path = pg_catalog, public
AS $$
DECLARE
    asset_prefix text;
    prefix_base text;
    source_prefix text;
    source_key text;
    snapshot_key text;
    suffix text;
    logo_filename text;
BEGIN
    IF p_asset_snapshot IS NULL
       OR jsonb_typeof(p_asset_snapshot) <> 'object'
       OR p_asset_snapshot -> 'version' <> '1'::jsonb
       OR jsonb_typeof(p_asset_snapshot -> 'prefix') <> 'string'
       OR jsonb_typeof(p_asset_snapshot -> 'objects') <> 'object'
       OR p_app_id IS NULL
       OR p_app_id !~ '^[A-Za-z0-9_-]{1,200}$'
       OR p_app_metadata_id IS NULL
       OR p_app_metadata_id !~ '^[A-Za-z0-9_-]{1,200}$'
       OR p_metadata_snapshot IS NULL
       OR jsonb_typeof(p_metadata_snapshot) <> 'object' THEN
        RETURN false;
    END IF;

    asset_prefix := p_asset_snapshot ->> 'prefix';
    prefix_base := 'review-submissions/' || p_app_id || '/' || p_app_metadata_id || '/';
    source_prefix := 'unverified/' || p_app_id || '/';

    IF left(asset_prefix, length(prefix_base)) IS DISTINCT FROM prefix_base
       OR substring(asset_prefix FROM length(prefix_base) + 1) !~ '^[a-f0-9]{32}/$' THEN
        RETURN false;
    END IF;

    FOR source_key, snapshot_key IN
        SELECT entry.key, entry.value
        FROM jsonb_each_text(p_asset_snapshot -> 'objects') AS entry
    LOOP
        IF left(source_key, length(source_prefix)) IS DISTINCT FROM source_prefix THEN
            RETURN false;
        END IF;
        suffix := substring(source_key FROM length(source_prefix) + 1);
        IF suffix !~ '^(?:[A-Za-z]{2,3}(?:[-_][A-Za-z0-9]{2,8})*/)?[A-Za-z0-9][A-Za-z0-9._-]{0,255}$'
           OR snapshot_key IS DISTINCT FROM asset_prefix || suffix THEN
            RETURN false;
        END IF;
    END LOOP;

    logo_filename := p_metadata_snapshot ->> 'logo_img_url';
    IF logo_filename IS NULL
       OR logo_filename !~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,255}$'
       OR NOT (p_asset_snapshot -> 'objects' ? (source_prefix || logo_filename)) THEN
        RETURN false;
    END IF;

    RETURN true;
END;
$$;

DROP FUNCTION public.capture_listing_review_submission(
    text,
    text,
    text,
    text,
    boolean,
    timestamptz,
    jsonb
);

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
    previous_workflow_bypass text := current_setting('reviewer.workflow_bypass', true);
    captured_submission public.app_review_submission%ROWTYPE;
BEGIN
    PERFORM set_config('reviewer.workflow_bypass', 'on', true);
    BEGIN
        SELECT captured.*
        INTO captured_submission
        FROM public.capture_listing_review_submission_without_reviewer_bypass(
            p_app_metadata_id,
            p_changelog,
            p_submitted_by_subject,
            p_submitted_by_email,
            p_listing_consent,
            p_expected_metadata_updated_at,
            p_expected_localizations_snapshot
        ) AS captured;

        IF NOT FOUND THEN
            PERFORM set_config(
                'reviewer.workflow_bypass',
                COALESCE(previous_workflow_bypass, ''),
                true
            );
            RETURN;
        END IF;

        IF NOT public.is_valid_reviewer_asset_snapshot(
            p_asset_snapshot,
            captured_submission.app_id,
            captured_submission.app_metadata_id,
            captured_submission.metadata_snapshot
        ) THEN
            RAISE EXCEPTION 'Invalid reviewer submission asset snapshot.';
        END IF;

        UPDATE public.app_review_submission
        SET asset_snapshot = p_asset_snapshot
        WHERE id = captured_submission.id
          AND asset_snapshot IS NULL
        RETURNING * INTO captured_submission;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Reviewer submission asset snapshot changed during capture.';
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
    RETURN NEXT captured_submission;
END;
$$;

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
    submission public.app_review_submission%ROWTYPE;
    current_metadata public.app_metadata%ROWTYPE;
    current_localizations jsonb;
BEGIN
    SELECT candidate.*
    INTO submission
    FROM public.app_review_submission AS candidate
    WHERE candidate.id = p_submission_id
      AND candidate.review_version = p_expected_review_version
      AND candidate.status IN ('pending', 'in_review')
      AND candidate.asset_snapshot IS NULL
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    SELECT metadata.*
    INTO current_metadata
    FROM public.app_metadata AS metadata
    WHERE metadata.id = submission.app_metadata_id
      AND metadata.app_id = submission.app_id
      AND metadata.verification_status = 'awaiting_review'
      AND metadata.updated_at = submission.metadata_updated_at
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
        WHERE localization.app_metadata_id = submission.app_metadata_id
        ORDER BY localization.locale, localization.id
        FOR UPDATE
    ) AS locked_localization;

    IF current_localizations IS DISTINCT FROM submission.localizations_snapshot
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
      AND asset_snapshot IS NULL
    RETURNING * INTO submission;

    IF FOUND THEN
        RETURN NEXT submission;
    END IF;
END;
$$;

CREATE FUNCTION public.guard_reviewer_approval_asset_snapshot()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
    IF OLD.asset_snapshot IS NOT NULL
       AND NEW.asset_snapshot IS DISTINCT FROM OLD.asset_snapshot THEN
        RAISE EXCEPTION 'Reviewer submission asset snapshots are immutable.';
    END IF;

    IF NEW.status = 'approved'
       AND NOT public.is_valid_reviewer_asset_snapshot(
           NEW.asset_snapshot,
           NEW.app_id,
           NEW.app_metadata_id,
           NEW.metadata_snapshot
       ) THEN
        RAISE EXCEPTION 'A review cannot be approved without an immutable asset snapshot.';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER guard_reviewer_approval_asset_snapshot
BEFORE UPDATE OF status, asset_snapshot ON public.app_review_submission
FOR EACH ROW
EXECUTE FUNCTION public.guard_reviewer_approval_asset_snapshot();
