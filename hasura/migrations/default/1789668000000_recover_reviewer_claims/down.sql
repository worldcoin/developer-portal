CREATE OR REPLACE FUNCTION public.reviewer_claim_app_review_submission(
    p_submission_id uuid,
    p_expected_review_version integer,
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
    candidate public.app_review_submission%ROWTYPE;
    claimed_submission public.app_review_submission%ROWTYPE;
BEGIN
    SELECT submission.*
    INTO candidate
    FROM public.app_review_submission AS submission
    WHERE submission.id = p_submission_id
      AND submission.review_version = p_expected_review_version
    FOR UPDATE;

    IF NOT FOUND
       OR candidate.status NOT IN ('pending', 'in_review')
       OR (
           candidate.claim_token IS NOT NULL
           AND candidate.claim_expires_at > now()
       ) THEN
        RETURN;
    END IF;

    UPDATE public.app_review_submission
    SET status = 'in_review',
        review_version = review_version + 1,
        claim_token = gen_random_uuid(),
        claimed_by_subject = p_actor_subject,
        claimed_by_email = p_actor_email,
        claimed_at = now(),
        claim_expires_at = now() + interval '30 minutes'
    WHERE id = candidate.id
      AND review_version = p_expected_review_version
    RETURNING * INTO claimed_submission;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    IF candidate.claim_token IS NOT NULL
       AND (
           candidate.claim_expires_at IS NULL
           OR candidate.claim_expires_at <= now()
       ) THEN
        INSERT INTO public.app_review_event (
            submission_id,
            event_type,
            actor_subject,
            actor_email,
            review_version,
            payload
        )
        VALUES (
            candidate.id,
            'claim_expired',
            candidate.claimed_by_subject,
            candidate.claimed_by_email,
            claimed_submission.review_version,
            jsonb_build_object(
                'expired_at', candidate.claim_expires_at,
                'next_claimed_by_subject', p_actor_subject,
                'next_claimed_by_email', p_actor_email
            )
        );
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
        claimed_submission.id,
        'claimed',
        p_actor_subject,
        p_actor_email,
        claimed_submission.review_version,
        jsonb_build_object(
            'claim_expires_at', claimed_submission.claim_expires_at
        )
    );

    RETURN NEXT claimed_submission;
END;
$$;

COMMENT ON FUNCTION public.reviewer_claim_app_review_submission(uuid, integer, text, text) IS NULL;
