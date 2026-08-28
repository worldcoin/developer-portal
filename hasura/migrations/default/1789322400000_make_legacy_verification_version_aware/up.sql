CREATE TABLE public.legacy_app_verification_asset_settlement (
    operation_id uuid PRIMARY KEY,
    app_id text NOT NULL,
    app_metadata_id text NOT NULL,
    expected_metadata_updated_at timestamptz NOT NULL,
    prepared_asset_keys text[] NOT NULL,
    prior_asset_keys text[] NOT NULL,
    outcome text NOT NULL DEFAULT 'pending',
    delivery_status text NOT NULL DEFAULT 'pending',
    attempt_count integer NOT NULL DEFAULT 0,
    next_attempt_at timestamptz NOT NULL DEFAULT (now() + interval '15 minutes'),
    locked_at timestamptz,
    locked_by text,
    last_error text,
    delivered_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT legacy_app_verification_asset_settlement_outcome_check
        CHECK (outcome IN ('pending', 'committed', 'aborted')),
    CONSTRAINT legacy_app_verification_asset_settlement_delivery_check
        CHECK (delivery_status IN (
            'pending',
            'processing',
            'failed',
            'delivered',
            'dead_letter'
        )),
    CONSTRAINT legacy_app_verification_asset_settlement_attempt_check
        CHECK (attempt_count >= 0),
    CONSTRAINT legacy_app_verification_asset_settlement_key_count_check
        CHECK (
            cardinality(prepared_asset_keys) BETWEEN 1 AND 1000
            AND cardinality(prior_asset_keys) BETWEEN 0 AND 1000
        )
);

CREATE INDEX legacy_app_verification_asset_settlement_queue
ON public.legacy_app_verification_asset_settlement (
    delivery_status,
    next_attempt_at,
    created_at
)
WHERE delivery_status IN ('pending', 'failed', 'processing');

CREATE FUNCTION public.register_legacy_app_verification_asset_settlement(
    p_operation_id uuid,
    p_app_id text,
    p_app_metadata_id text,
    p_expected_metadata_updated_at timestamptz,
    p_prepared_asset_keys jsonb,
    p_prior_asset_keys jsonb
)
RETURNS SETOF public.legacy_app_verification_asset_settlement
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
DECLARE
    settlement public.legacy_app_verification_asset_settlement%ROWTYPE;
    submitted_metadata public.app_metadata%ROWTYPE;
    prepared_keys text[];
    prior_keys text[];
BEGIN
    IF p_operation_id IS NULL
       OR p_app_id IS NULL
       OR p_app_id !~ '^[A-Za-z0-9_-]+$'
       OR p_app_metadata_id IS NULL
       OR p_app_metadata_id !~ '^[A-Za-z0-9_-]+$'
       OR p_expected_metadata_updated_at IS NULL
       OR p_prepared_asset_keys IS NULL
       OR jsonb_typeof(p_prepared_asset_keys) <> 'array'
       OR jsonb_array_length(p_prepared_asset_keys) NOT BETWEEN 1 AND 1000
       OR p_prior_asset_keys IS NULL
       OR jsonb_typeof(p_prior_asset_keys) <> 'array'
       OR jsonb_array_length(p_prior_asset_keys) > 1000 THEN
        RETURN;
    END IF;

    IF EXISTS (
           SELECT 1
           FROM jsonb_array_elements(p_prepared_asset_keys) AS asset_key(value)
           WHERE jsonb_typeof(asset_key.value) <> 'string'
              OR asset_key.value #>> '{}' !~ '^verified/[A-Za-z0-9_-]+/(?:[A-Za-z0-9_-]+/)?[A-Za-z0-9_-]+\.(png|jpg|jpeg)$'
              OR split_part(asset_key.value #>> '{}', '/', 2) IS DISTINCT FROM p_app_id
       )
       OR EXISTS (
           SELECT 1
           FROM jsonb_array_elements(p_prior_asset_keys) AS asset_key(value)
           WHERE jsonb_typeof(asset_key.value) <> 'string'
              OR asset_key.value #>> '{}' !~ '^verified/[A-Za-z0-9_-]+/(?:[A-Za-z0-9_-]+/)?[A-Za-z0-9_-]+\.(png|jpg|jpeg)$'
              OR split_part(asset_key.value #>> '{}', '/', 2) IS DISTINCT FROM p_app_id
       ) THEN
        RETURN;
    END IF;

    SELECT ARRAY(
        SELECT DISTINCT asset_key.value
        FROM jsonb_array_elements_text(p_prepared_asset_keys) AS asset_key(value)
        ORDER BY asset_key.value
    ) INTO prepared_keys;
    SELECT ARRAY(
        SELECT DISTINCT asset_key.value
        FROM jsonb_array_elements_text(p_prior_asset_keys) AS asset_key(value)
        ORDER BY asset_key.value
    ) INTO prior_keys;

    IF cardinality(prepared_keys) <> jsonb_array_length(p_prepared_asset_keys)
       OR cardinality(prior_keys) <> jsonb_array_length(p_prior_asset_keys) THEN
        RETURN;
    END IF;

    -- A retry of an already-registered operation is exact and remains valid
    -- even if the draft changed after the first registration.
    SELECT candidate.*
    INTO settlement
    FROM public.legacy_app_verification_asset_settlement AS candidate
    WHERE candidate.operation_id = p_operation_id
      AND candidate.app_id = p_app_id
      AND candidate.app_metadata_id = p_app_metadata_id
      AND candidate.expected_metadata_updated_at = p_expected_metadata_updated_at
      AND candidate.prepared_asset_keys = prepared_keys
      AND candidate.prior_asset_keys = prior_keys;

    IF FOUND THEN
        RETURN NEXT settlement;
        RETURN;
    END IF;

    PERFORM pg_advisory_xact_lock(hashtextextended(p_app_metadata_id, 0));

    SELECT candidate.*
    INTO submitted_metadata
    FROM public.app_metadata AS candidate
    WHERE candidate.id = p_app_metadata_id
      AND candidate.app_id = p_app_id
      AND candidate.updated_at = p_expected_metadata_updated_at
      AND candidate.verification_status = 'awaiting_review'
    FOR SHARE;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    INSERT INTO public.legacy_app_verification_asset_settlement (
        operation_id,
        app_id,
        app_metadata_id,
        expected_metadata_updated_at,
        prepared_asset_keys,
        prior_asset_keys
    )
    VALUES (
        p_operation_id,
        p_app_id,
        p_app_metadata_id,
        p_expected_metadata_updated_at,
        prepared_keys,
        prior_keys
    )
    ON CONFLICT (operation_id) DO NOTHING
    RETURNING * INTO settlement;

    IF settlement.operation_id IS NULL THEN
        SELECT candidate.*
        INTO settlement
        FROM public.legacy_app_verification_asset_settlement AS candidate
        WHERE candidate.operation_id = p_operation_id
          AND candidate.app_id = p_app_id
          AND candidate.app_metadata_id = p_app_metadata_id
          AND candidate.expected_metadata_updated_at = p_expected_metadata_updated_at
          AND candidate.prepared_asset_keys = prepared_keys
          AND candidate.prior_asset_keys = prior_keys;
    END IF;

    IF settlement.operation_id IS NOT NULL THEN
        RETURN NEXT settlement;
    END IF;
END;
$$;

ALTER TABLE public.app_metadata
ADD COLUMN legacy_verification_operation_id uuid;

CREATE UNIQUE INDEX app_metadata_legacy_verification_operation_id_key
ON public.app_metadata (legacy_verification_operation_id)
WHERE legacy_verification_operation_id IS NOT NULL;

CREATE FUNCTION public.legacy_verify_app_metadata(
    p_app_id text,
    p_app_metadata_id text,
    p_operation_id uuid,
    p_expected_metadata_updated_at timestamptz,
    p_expected_prior_verified_id text,
    p_expected_prior_verified_updated_at timestamptz,
    p_expected_localization_versions jsonb,
    p_reviewer_name text,
    p_is_reviewer_app_store_approved boolean,
    p_is_reviewer_world_app_approved boolean,
    p_metadata_assets jsonb,
    p_localization_assets jsonb
)
RETURNS SETOF public.app_metadata
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
DECLARE
    metadata public.app_metadata%ROWTYPE;
    asset_settlement public.legacy_app_verification_asset_settlement%ROWTYPE;
    reviewed_app public.app%ROWTYPE;
    prior_verified_metadata public.app_metadata%ROWTYPE;
    verified_metadata public.app_metadata%ROWTYPE;
    localization_update record;
    prior_verified_count integer;
    localization_count integer;
    expected_localization_count integer;
    affected_rows integer;
    prior_verified_found boolean := false;
    native_app_store_approved boolean;
    native_world_app_approved boolean;
    previous_workflow_bypass text := current_setting(
        'reviewer.workflow_bypass',
        true
    );
BEGIN
    IF btrim(COALESCE(p_app_id, '')) = ''
       OR btrim(COALESCE(p_app_metadata_id, '')) = ''
       OR p_operation_id IS NULL
       OR p_expected_metadata_updated_at IS NULL
       OR ((p_expected_prior_verified_id IS NULL) <>
           (p_expected_prior_verified_updated_at IS NULL))
       OR p_expected_localization_versions IS NULL
       OR jsonb_typeof(p_expected_localization_versions) <> 'object'
       OR btrim(COALESCE(p_reviewer_name, '')) = ''
       OR p_is_reviewer_app_store_approved IS NULL
       OR p_is_reviewer_world_app_approved IS NULL
       OR p_metadata_assets IS NULL
       OR jsonb_typeof(p_metadata_assets) <> 'object'
       OR p_localization_assets IS NULL
       OR jsonb_typeof(p_localization_assets) <> 'object'
       OR btrim(COALESCE(p_metadata_assets ->> 'logo_img_url', '')) = '' THEN
        RETURN;
    END IF;

    PERFORM pg_advisory_xact_lock(hashtextextended(p_app_metadata_id, 0));

    SELECT candidate.*
    INTO metadata
    FROM public.app_metadata AS candidate
    WHERE candidate.id = p_app_metadata_id
      AND candidate.app_id = p_app_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    -- Retrying a request after a lost response is an exact read of that
    -- operation's durable result. A different operation cannot claim it.
    IF metadata.verification_status = 'verified'
       AND metadata.legacy_verification_operation_id = p_operation_id THEN
        RETURN NEXT metadata;
        RETURN;
    END IF;

    IF metadata.updated_at IS DISTINCT FROM p_expected_metadata_updated_at
       OR metadata.verification_status IS DISTINCT FROM 'awaiting_review' THEN
        RETURN;
    END IF;

    SELECT candidate.*
    INTO asset_settlement
    FROM public.legacy_app_verification_asset_settlement AS candidate
    WHERE candidate.operation_id = p_operation_id
      AND candidate.app_id = p_app_id
      AND candidate.app_metadata_id = p_app_metadata_id
      AND candidate.expected_metadata_updated_at = p_expected_metadata_updated_at
      AND candidate.outcome = 'pending'
      AND candidate.delivery_status = 'pending'
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    SELECT candidate.*
    INTO reviewed_app
    FROM public.app AS candidate
    WHERE candidate.id = p_app_id
    FOR UPDATE;

    IF NOT FOUND OR reviewed_app.deleted_at IS NOT NULL THEN
        RETURN;
    END IF;

    -- Listing-consented developer-selectable apps and every active attempt are
    -- exclusively owned by the Reviewer workflow.
    IF (metadata.app_mode IN ('mini-app', 'external')
        AND metadata.is_developer_allow_listing IS TRUE)
       OR EXISTS (
           SELECT 1
           FROM public.app_review_submission AS active_submission
           WHERE active_submission.app_id = p_app_id
             AND active_submission.status IN ('pending', 'in_review')
       ) THEN
        RETURN;
    END IF;

    native_app_store_approved := metadata.app_mode = 'native'
        AND p_is_reviewer_app_store_approved;
    native_world_app_approved := metadata.app_mode = 'native'
        AND p_is_reviewer_world_app_approved;

    IF (native_app_store_approved OR native_world_app_approved)
       AND metadata.showcase_img_urls IS NULL THEN
        RETURN;
    END IF;

    SELECT COUNT(*)
    INTO prior_verified_count
    FROM public.app_metadata AS prior_verified
    WHERE prior_verified.app_id = p_app_id
      AND prior_verified.id <> p_app_metadata_id
      AND prior_verified.verification_status = 'verified';

    IF prior_verified_count > 1 THEN
        RETURN;
    END IF;

    SELECT prior_verified.*
    INTO prior_verified_metadata
    FROM public.app_metadata AS prior_verified
    WHERE prior_verified.app_id = p_app_id
      AND prior_verified.id <> p_app_metadata_id
      AND prior_verified.verification_status = 'verified'
    LIMIT 1
    FOR UPDATE;
    prior_verified_found := FOUND;

    IF prior_verified_found IS DISTINCT FROM
       (p_expected_prior_verified_id IS NOT NULL) THEN
        RETURN;
    END IF;

    IF prior_verified_found AND (
        prior_verified_metadata.id IS DISTINCT FROM p_expected_prior_verified_id
        OR prior_verified_metadata.updated_at IS DISTINCT FROM
            p_expected_prior_verified_updated_at
    ) THEN
        RETURN;
    END IF;

    -- Lock and compare every localization version before mutating any row.
    PERFORM 1
    FROM public.localisations AS localization
    WHERE localization.app_metadata_id = p_app_metadata_id
    ORDER BY localization.id
    FOR UPDATE;

    SELECT COUNT(*)
    INTO localization_count
    FROM public.localisations AS localization
    WHERE localization.app_metadata_id = p_app_metadata_id;

    SELECT COUNT(*)
    INTO expected_localization_count
    FROM jsonb_object_keys(p_expected_localization_versions);

    IF localization_count <> expected_localization_count
       OR EXISTS (
           SELECT 1
           FROM public.localisations AS localization
           WHERE localization.app_metadata_id = p_app_metadata_id
             AND (
                 NOT (p_expected_localization_versions ? localization.id)
                 OR jsonb_typeof(
                     p_expected_localization_versions -> localization.id
                 ) <> 'string'
                 OR localization.updated_at IS DISTINCT FROM
                     (p_expected_localization_versions ->> localization.id)::timestamptz
             )
       )
       OR EXISTS (
           SELECT 1
           FROM jsonb_each(p_localization_assets) AS prepared_localization
           WHERE jsonb_typeof(prepared_localization.value) <> 'object'
              OR NOT EXISTS (
                  SELECT 1
                  FROM public.localisations AS localization
                  WHERE localization.id = prepared_localization.key
                    AND localization.app_metadata_id = p_app_metadata_id
              )
       ) THEN
        RETURN;
    END IF;

    PERFORM set_config('reviewer.workflow_bypass', 'on', true);
    IF prior_verified_found THEN
        DELETE FROM public.app_metadata
        WHERE id = p_expected_prior_verified_id
          AND app_id = p_app_id
          AND updated_at = p_expected_prior_verified_updated_at
          AND verification_status = 'verified';

        GET DIAGNOSTICS affected_rows = ROW_COUNT;
        IF affected_rows <> 1 THEN
            RAISE EXCEPTION 'Exact prior verified metadata changed during verification.';
        END IF;
    END IF;

    UPDATE public.app_metadata
    SET logo_img_url = p_metadata_assets ->> 'logo_img_url',
        hero_image_url = '',
        meta_tag_image_url = COALESCE(
            p_metadata_assets ->> 'meta_tag_image_url',
            ''
        ),
        content_card_image_url = COALESCE(
            p_metadata_assets ->> 'content_card_image_url',
            ''
        ),
        showcase_img_urls = CASE
            WHEN p_metadata_assets -> 'showcase_img_urls' IS NULL
              OR p_metadata_assets -> 'showcase_img_urls' = 'null'::jsonb
            THEN NULL
            ELSE ARRAY(
                SELECT jsonb_array_elements_text(
                    p_metadata_assets -> 'showcase_img_urls'
                )
            )
        END,
        verification_status = 'verified',
        verified_at = now(),
        reviewed_by = p_reviewer_name,
        legacy_verification_operation_id = p_operation_id,
        is_reviewer_app_store_approved = native_app_store_approved,
        is_reviewer_world_app_approved = native_world_app_approved
    WHERE id = p_app_metadata_id
      AND app_id = p_app_id
      AND updated_at = p_expected_metadata_updated_at
      AND verification_status = 'awaiting_review'
    RETURNING * INTO verified_metadata;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Exact submitted metadata changed during verification.';
    END IF;

    FOR localization_update IN
        SELECT prepared_localization.key AS localization_id,
               prepared_localization.value AS assets
        FROM jsonb_each(p_localization_assets) AS prepared_localization
    LOOP
        UPDATE public.localisations
        SET meta_tag_image_url = CASE
                WHEN localization_update.assets ? 'meta_tag_image_url'
                THEN COALESCE(
                    localization_update.assets ->> 'meta_tag_image_url',
                    ''
                )
                ELSE meta_tag_image_url
            END,
            showcase_img_urls = CASE
                WHEN NOT (localization_update.assets ? 'showcase_img_urls')
                THEN showcase_img_urls
                WHEN localization_update.assets -> 'showcase_img_urls' IS NULL
                  OR localization_update.assets -> 'showcase_img_urls' = 'null'::jsonb
                THEN NULL
                ELSE ARRAY(
                    SELECT jsonb_array_elements_text(
                        localization_update.assets -> 'showcase_img_urls'
                    )
                )
            END
        WHERE id = localization_update.localization_id
          AND app_metadata_id = p_app_metadata_id;

        GET DIAGNOSTICS affected_rows = ROW_COUNT;
        IF affected_rows <> 1 THEN
            RAISE EXCEPTION 'Exact localization changed during verification.';
        END IF;
    END LOOP;

    UPDATE public.app
    SET first_verified_at = COALESCE(first_verified_at, now())
    WHERE id = p_app_id;

    UPDATE public.legacy_app_verification_asset_settlement
    SET outcome = 'committed',
        next_attempt_at = now() + interval '5 minutes',
        updated_at = now()
    WHERE operation_id = p_operation_id
      AND outcome = 'pending'
      AND delivery_status = 'pending';

    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    IF affected_rows <> 1 THEN
        RAISE EXCEPTION 'Legacy verification asset settlement changed.';
    END IF;

    PERFORM set_config(
        'reviewer.workflow_bypass',
        COALESCE(previous_workflow_bypass, ''),
        true
    );

    RETURN NEXT verified_metadata;
EXCEPTION WHEN OTHERS THEN
    PERFORM set_config(
        'reviewer.workflow_bypass',
        COALESCE(previous_workflow_bypass, ''),
        true
    );
    RAISE;
END;
$$;

CREATE FUNCTION public.reviewer_claim_legacy_app_verification_asset_settlements(
    p_worker_id text,
    p_limit integer
)
RETURNS SETOF public.legacy_app_verification_asset_settlement
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
DECLARE
    candidate record;
    metadata public.app_metadata%ROWTYPE;
    settlement public.legacy_app_verification_asset_settlement%ROWTYPE;
    resolved_outcome text;
BEGIN
    IF btrim(COALESCE(p_worker_id, '')) = ''
       OR length(p_worker_id) > 200
       OR p_limit IS NULL
       OR p_limit NOT BETWEEN 1 AND 50 THEN
        RETURN;
    END IF;

    FOR candidate IN
        SELECT queued.operation_id, queued.app_metadata_id
        FROM public.legacy_app_verification_asset_settlement AS queued
        WHERE (
            queued.attempt_count < 8
            AND (
              (
                  queued.delivery_status IN ('pending', 'failed')
                  AND queued.next_attempt_at <= now()
              )
              OR (
                  queued.delivery_status = 'processing'
                  AND queued.locked_at <= now() - interval '5 minutes'
              )
            )
        ) OR (
            queued.delivery_status = 'processing'
            AND queued.locked_at <= now() - interval '5 minutes'
            AND queued.attempt_count >= 8
        )
        ORDER BY queued.next_attempt_at, queued.created_at, queued.operation_id
        LIMIT p_limit
    LOOP
        PERFORM pg_advisory_xact_lock(
            hashtextextended(candidate.app_metadata_id, 0)
        );

        SELECT exact_metadata.*
        INTO metadata
        FROM public.app_metadata AS exact_metadata
        WHERE exact_metadata.id = candidate.app_metadata_id
        FOR UPDATE;

        SELECT queued.*
        INTO settlement
        FROM public.legacy_app_verification_asset_settlement AS queued
        WHERE queued.operation_id = candidate.operation_id
          AND (
            (
              queued.attempt_count < 8
              AND (
              (
                  queued.delivery_status IN ('pending', 'failed')
                  AND queued.next_attempt_at <= now()
              )
              OR (
                  queued.delivery_status = 'processing'
                  AND queued.locked_at <= now() - interval '5 minutes'
              )
              )
            ) OR (
              queued.delivery_status = 'processing'
              AND queued.locked_at <= now() - interval '5 minutes'
              AND queued.attempt_count >= 8
            )
          )
        FOR UPDATE SKIP LOCKED;

        IF NOT FOUND THEN
            CONTINUE;
        END IF;

        -- Keep the same advisory -> metadata -> settlement order as
        -- completion, even when expiring an exhausted processing lease.
        IF settlement.delivery_status = 'processing'
           AND settlement.locked_at <= now() - interval '5 minutes'
           AND settlement.attempt_count >= 8 THEN
            UPDATE public.legacy_app_verification_asset_settlement
            SET delivery_status = 'dead_letter',
                locked_at = NULL,
                locked_by = NULL,
                last_error = COALESCE(
                    last_error,
                    'Legacy verification asset settlement exhausted its retry lease.'
                ),
                updated_at = now()
            WHERE operation_id = settlement.operation_id;
            CONTINUE;
        END IF;

        resolved_outcome := settlement.outcome;
        IF resolved_outcome = 'pending' THEN
            resolved_outcome := CASE
                WHEN metadata.id = settlement.app_metadata_id
                 AND metadata.app_id = settlement.app_id
                 AND metadata.verification_status = 'verified'
                 AND metadata.legacy_verification_operation_id =
                     settlement.operation_id
                THEN 'committed'
                ELSE 'aborted'
            END;
        END IF;

        UPDATE public.legacy_app_verification_asset_settlement
        SET outcome = resolved_outcome,
            delivery_status = 'processing',
            attempt_count = attempt_count + 1,
            locked_at = now(),
            locked_by = p_worker_id,
            updated_at = now()
        WHERE operation_id = settlement.operation_id
        RETURNING * INTO settlement;

        RETURN NEXT settlement;
    END LOOP;
END;
$$;

CREATE FUNCTION public.complete_legacy_app_verification_asset_settlement(
    p_operation_id uuid,
    p_worker_id text,
    p_expected_outcome text,
    p_delivery_succeeded boolean,
    p_error text
)
RETURNS SETOF public.legacy_app_verification_asset_settlement
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
DECLARE
    metadata public.app_metadata%ROWTYPE;
    settlement public.legacy_app_verification_asset_settlement%ROWTYPE;
    resolved_outcome text;
    next_attempt_count integer;
BEGIN
    IF p_operation_id IS NULL
       OR p_expected_outcome NOT IN ('committed', 'aborted')
       OR p_delivery_succeeded IS NULL
       OR (
           p_delivery_succeeded IS FALSE
           AND btrim(COALESCE(p_error, '')) = ''
       )
       OR length(COALESCE(p_worker_id, '')) > 200 THEN
        RETURN;
    END IF;

    SELECT candidate.*
    INTO settlement
    FROM public.legacy_app_verification_asset_settlement AS candidate
    WHERE candidate.operation_id = p_operation_id;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    PERFORM pg_advisory_xact_lock(
        hashtextextended(settlement.app_metadata_id, 0)
    );

    SELECT exact_metadata.*
    INTO metadata
    FROM public.app_metadata AS exact_metadata
    WHERE exact_metadata.id = settlement.app_metadata_id
      AND exact_metadata.app_id = settlement.app_id
    FOR UPDATE;

    SELECT candidate.*
    INTO settlement
    FROM public.legacy_app_verification_asset_settlement AS candidate
    WHERE candidate.operation_id = p_operation_id
    FOR UPDATE;

    IF settlement.delivery_status IN ('delivered', 'dead_letter') THEN
        IF settlement.outcome = p_expected_outcome THEN
            RETURN NEXT settlement;
        END IF;
        RETURN;
    END IF;

    IF p_worker_id IS NULL THEN
        IF settlement.delivery_status NOT IN ('pending', 'failed') THEN
            RETURN;
        END IF;
    ELSIF settlement.delivery_status <> 'processing'
       OR settlement.locked_by IS DISTINCT FROM p_worker_id THEN
        RETURN;
    END IF;

    resolved_outcome := settlement.outcome;
    IF resolved_outcome = 'pending' THEN
        resolved_outcome := CASE
            WHEN metadata.id = settlement.app_metadata_id
             AND metadata.verification_status = 'verified'
             AND metadata.legacy_verification_operation_id =
                 settlement.operation_id
            THEN 'committed'
            ELSE 'aborted'
        END;
    END IF;

    IF resolved_outcome IS DISTINCT FROM p_expected_outcome THEN
        RETURN;
    END IF;

    next_attempt_count := settlement.attempt_count + CASE
        WHEN p_delivery_succeeded IS FALSE AND p_worker_id IS NULL THEN 1
        ELSE 0
    END;

    UPDATE public.legacy_app_verification_asset_settlement
    SET outcome = resolved_outcome,
        delivery_status = CASE
            WHEN p_delivery_succeeded THEN 'delivered'
            WHEN next_attempt_count >= 8 THEN 'dead_letter'
            ELSE 'failed'
        END,
        attempt_count = next_attempt_count,
        next_attempt_at = CASE
            WHEN p_delivery_succeeded OR next_attempt_count >= 8
            THEN next_attempt_at
            ELSE now() + make_interval(
                mins => power(
                    2,
                    LEAST(GREATEST(next_attempt_count - 1, 0), 7)
                )::integer
            )
        END,
        locked_at = NULL,
        locked_by = NULL,
        last_error = CASE
            WHEN p_delivery_succeeded THEN NULL
            ELSE left(p_error, 2000)
        END,
        delivered_at = CASE
            WHEN p_delivery_succeeded THEN now()
            ELSE NULL
        END,
        updated_at = now()
    WHERE operation_id = p_operation_id
    RETURNING * INTO settlement;

    RETURN NEXT settlement;
END;
$$;
