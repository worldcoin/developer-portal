CREATE FUNCTION public.withdraw_app_reviews_on_soft_delete()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
DECLARE
    withdrawn_submission public.app_review_submission%ROWTYPE;
BEGIN
    FOR withdrawn_submission IN
        UPDATE public.app_review_submission
        SET status = 'withdrawn',
            review_version = review_version + 1,
            claim_token = NULL,
            claimed_by_subject = NULL,
            claimed_by_email = NULL,
            claimed_at = NULL,
            claim_expires_at = NULL,
            completed_at = now()
        WHERE app_id = NEW.id
          AND status IN ('pending', 'in_review')
        RETURNING *
    LOOP
        UPDATE public.app_metadata
        SET verification_status = 'unverified'
        WHERE id = withdrawn_submission.app_metadata_id
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
            withdrawn_submission.id,
            'withdrawn',
            'system:app-deletion',
            NULL,
            withdrawn_submission.review_version,
            jsonb_build_object(
                'reason', 'app_deleted',
                'deleted_at', NEW.deleted_at
            )
        );
    END LOOP;

    RETURN NEW;
END;
$$;

CREATE TRIGGER withdraw_app_reviews_on_soft_delete
BEFORE UPDATE OF deleted_at ON public.app
FOR EACH ROW
WHEN (OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL)
EXECUTE FUNCTION public.withdraw_app_reviews_on_soft_delete();

CREATE FUNCTION public.withdraw_team_reviews_on_soft_delete()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
DECLARE
    withdrawn_submission public.app_review_submission%ROWTYPE;
BEGIN
    FOR withdrawn_submission IN
        UPDATE public.app_review_submission
        SET status = 'withdrawn',
            review_version = review_version + 1,
            claim_token = NULL,
            claimed_by_subject = NULL,
            claimed_by_email = NULL,
            claimed_at = NULL,
            claim_expires_at = NULL,
            completed_at = now()
        WHERE team_id = NEW.id
          AND status IN ('pending', 'in_review')
        RETURNING *
    LOOP
        UPDATE public.app_metadata
        SET verification_status = 'unverified'
        WHERE id = withdrawn_submission.app_metadata_id
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
            withdrawn_submission.id,
            'withdrawn',
            'system:team-deletion',
            NULL,
            withdrawn_submission.review_version,
            jsonb_build_object(
                'reason', 'team_deleted',
                'deleted_at', NEW.deleted_at
            )
        );
    END LOOP;

    RETURN NEW;
END;
$$;

CREATE TRIGGER withdraw_team_reviews_on_soft_delete
BEFORE UPDATE OF deleted_at ON public.team
FOR EACH ROW
WHEN (OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL)
EXECUTE FUNCTION public.withdraw_team_reviews_on_soft_delete();

-- Close the migration window for rows whose parent was already soft-deleted
-- before the transition triggers above existed.
DO $$
DECLARE
    candidate record;
    withdrawn_submission public.app_review_submission%ROWTYPE;
BEGIN
    FOR candidate IN
        SELECT submission.id,
               CASE
                   WHEN reviewed_app.deleted_at IS NOT NULL THEN 'app_deleted'
                   ELSE 'team_deleted'
               END AS deletion_reason,
               COALESCE(reviewed_app.deleted_at, owning_team.deleted_at) AS deleted_at
        FROM public.app_review_submission AS submission
        INNER JOIN public.app AS reviewed_app
            ON reviewed_app.id = submission.app_id
        INNER JOIN public.team AS owning_team
            ON owning_team.id = submission.team_id
        WHERE submission.status IN ('pending', 'in_review')
          AND (
              reviewed_app.deleted_at IS NOT NULL
              OR owning_team.deleted_at IS NOT NULL
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
            actor_email,
            review_version,
            payload
        )
        VALUES (
            withdrawn_submission.id,
            'withdrawn',
            'system:rollout-deletion-reconciliation',
            NULL,
            withdrawn_submission.review_version,
            jsonb_build_object(
                'reason', candidate.deletion_reason,
                'deleted_at', candidate.deleted_at,
                'rollout_reconciliation', true
            )
        );
    END LOOP;
END;
$$;
