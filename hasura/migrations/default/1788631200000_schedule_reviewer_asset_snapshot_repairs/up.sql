ALTER TABLE public.app_review_submission
ADD COLUMN asset_snapshot_repair_attempt_count integer NOT NULL DEFAULT 0,
ADD COLUMN asset_snapshot_repair_next_at timestamptz,
ADD COLUMN asset_snapshot_repair_last_error text,
ADD COLUMN asset_snapshot_repair_dead_lettered_at timestamptz,
ADD CONSTRAINT app_review_submission_asset_snapshot_repair_attempt_nonnegative
    CHECK (asset_snapshot_repair_attempt_count >= 0),
ADD CONSTRAINT app_review_submission_asset_snapshot_repair_schedule_valid
    CHECK (
        asset_snapshot_repair_dead_lettered_at IS NULL
        OR asset_snapshot_repair_next_at IS NULL
    );

CREATE FUNCTION public.normalize_app_review_asset_snapshot_repair_state()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
    IF NEW.asset_snapshot IS NOT NULL THEN
        NEW.asset_snapshot_repair_next_at := NULL;
        NEW.asset_snapshot_repair_last_error := NULL;
        NEW.asset_snapshot_repair_dead_lettered_at := NULL;
    ELSIF OLD.asset_snapshot IS NOT NULL THEN
        NEW.asset_snapshot_repair_attempt_count := 0;
        NEW.asset_snapshot_repair_next_at := NULL;
        NEW.asset_snapshot_repair_last_error := NULL;
        NEW.asset_snapshot_repair_dead_lettered_at := NULL;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER normalize_app_review_asset_snapshot_repair_state
BEFORE UPDATE OF asset_snapshot ON public.app_review_submission
FOR EACH ROW
EXECUTE FUNCTION public.normalize_app_review_asset_snapshot_repair_state();

CREATE FUNCTION public.reviewer_fail_app_review_asset_snapshot_repair(
    p_submission_id uuid,
    p_expected_review_version integer,
    p_expected_attempt_count integer,
    p_error text
)
RETURNS SETOF public.app_review_submission
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
DECLARE
    submission public.app_review_submission%ROWTYPE;
    failed_submission public.app_review_submission%ROWTYPE;
    next_attempt_count integer;
    retry_seconds double precision;
BEGIN
    IF p_expected_review_version IS NULL
       OR p_expected_attempt_count IS NULL
       OR p_expected_attempt_count < 0 THEN
        RETURN;
    END IF;

    SELECT candidate.*
    INTO submission
    FROM public.app_review_submission AS candidate
    WHERE candidate.id = p_submission_id
    FOR UPDATE;

    IF NOT FOUND
       OR submission.status NOT IN ('pending', 'in_review')
       OR submission.asset_snapshot IS NOT NULL
       OR submission.review_version <> p_expected_review_version
       OR submission.asset_snapshot_repair_attempt_count <> p_expected_attempt_count
       OR submission.asset_snapshot_repair_dead_lettered_at IS NOT NULL THEN
        RETURN;
    END IF;

    next_attempt_count := submission.asset_snapshot_repair_attempt_count + 1;
    retry_seconds := LEAST(
        3600::double precision,
        30::double precision * power(
            2::double precision,
            submission.asset_snapshot_repair_attempt_count::double precision
        )
    );

    UPDATE public.app_review_submission
    SET asset_snapshot_repair_attempt_count = next_attempt_count,
        asset_snapshot_repair_next_at = CASE
            WHEN next_attempt_count >= 8 THEN NULL
            ELSE now() + make_interval(secs => retry_seconds)
        END,
        asset_snapshot_repair_last_error = left(
            COALESCE(
                NULLIF(btrim(p_error), ''),
                'Reviewer submission asset snapshot failed.'
            ),
            500
        ),
        asset_snapshot_repair_dead_lettered_at = CASE
            WHEN next_attempt_count >= 8 THEN now()
            ELSE NULL
        END
    WHERE id = submission.id
    RETURNING * INTO failed_submission;

    RETURN NEXT failed_submission;
END;
$$;
