ALTER TABLE "public"."app_review_event"
ADD COLUMN "event_sequence" bigint GENERATED ALWAYS AS IDENTITY;

CREATE UNIQUE INDEX "app_review_event_event_sequence_unique"
ON "public"."app_review_event" ("event_sequence");

COMMENT ON COLUMN "public"."app_review_event"."event_sequence" IS
'Server-generated monotonic ordering key for immutable review history.';

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

CREATE OR REPLACE FUNCTION public.reviewer_heartbeat_app_review_submission(
    p_submission_id uuid,
    p_claim_token uuid,
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
    heartbeat_submission public.app_review_submission%ROWTYPE;
BEGIN
    SELECT submission.*
    INTO candidate
    FROM public.app_review_submission AS submission
    WHERE submission.id = p_submission_id
      AND submission.status = 'in_review'
      AND submission.review_version = p_expected_review_version
      AND submission.claim_token = p_claim_token
      AND submission.claimed_by_subject = p_actor_subject
      AND submission.claim_expires_at > now()
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    UPDATE public.app_review_submission
    SET review_version = review_version + 1,
        claim_expires_at = now() + interval '30 minutes'
    WHERE id = candidate.id
      AND review_version = p_expected_review_version
    RETURNING * INTO heartbeat_submission;

    IF NOT FOUND THEN
        RETURN;
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
        heartbeat_submission.id,
        'claim_heartbeat',
        p_actor_subject,
        p_actor_email,
        heartbeat_submission.review_version,
        jsonb_build_object(
            'claim_expires_at', heartbeat_submission.claim_expires_at
        )
    );

    RETURN NEXT heartbeat_submission;
END;
$$;

CREATE OR REPLACE FUNCTION public.reviewer_release_app_review_submission(
    p_submission_id uuid,
    p_claim_token uuid,
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
    released_submission public.app_review_submission%ROWTYPE;
BEGIN
    SELECT submission.*
    INTO candidate
    FROM public.app_review_submission AS submission
    WHERE submission.id = p_submission_id
      AND submission.status = 'in_review'
      AND submission.review_version = p_expected_review_version
      AND submission.claim_token = p_claim_token
      AND submission.claimed_by_subject = p_actor_subject
      AND submission.claim_expires_at > now()
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    UPDATE public.app_review_submission
    SET status = 'pending',
        review_version = review_version + 1,
        claim_token = NULL,
        claimed_by_subject = NULL,
        claimed_by_email = NULL,
        claimed_at = NULL,
        claim_expires_at = NULL
    WHERE id = candidate.id
      AND review_version = p_expected_review_version
    RETURNING * INTO released_submission;

    IF NOT FOUND THEN
        RETURN;
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
        released_submission.id,
        'claim_released',
        p_actor_subject,
        p_actor_email,
        released_submission.review_version,
        jsonb_build_object(
            'previous_claim_expires_at', candidate.claim_expires_at
        )
    );

    RETURN NEXT released_submission;
END;
$$;

CREATE OR REPLACE FUNCTION public.reviewer_save_app_review_checklist(
    p_submission_id uuid,
    p_claim_token uuid,
    p_expected_review_version integer,
    p_checklist_version text,
    p_checklist jsonb,
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
    saved_submission public.app_review_submission%ROWTYPE;
BEGIN
    IF p_checklist_version IS NULL
       OR btrim(p_checklist_version) = ''
       OR p_checklist IS NULL
       OR jsonb_typeof(p_checklist) <> 'object' THEN
        RETURN;
    END IF;

    SELECT submission.*
    INTO candidate
    FROM public.app_review_submission AS submission
    WHERE submission.id = p_submission_id
      AND submission.status = 'in_review'
      AND submission.review_version = p_expected_review_version
      AND submission.claim_token = p_claim_token
      AND submission.claimed_by_subject = p_actor_subject
      AND submission.claim_expires_at > now()
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    UPDATE public.app_review_submission
    SET review_version = review_version + 1,
        checklist_version = p_checklist_version,
        checklist = p_checklist
    WHERE id = candidate.id
      AND review_version = p_expected_review_version
    RETURNING * INTO saved_submission;

    IF NOT FOUND THEN
        RETURN;
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
        saved_submission.id,
        'checklist_updated',
        p_actor_subject,
        p_actor_email,
        saved_submission.review_version,
        jsonb_build_object(
            'checklist_version', saved_submission.checklist_version,
            'checklist', saved_submission.checklist
        )
    );

    RETURN NEXT saved_submission;
END;
$$;
