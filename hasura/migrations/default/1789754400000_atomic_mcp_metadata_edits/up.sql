CREATE FUNCTION public.mcp_patch_editable_app_metadata(
    p_app_metadata_id text,
    p_expected_verification_status text,
    p_expected_metadata_updated_at timestamptz,
    p_patch jsonb,
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
    metadata public.app_metadata%ROWTYPE;
    patched_metadata public.app_metadata%ROWTYPE;
    updated_metadata public.app_metadata%ROWTYPE;
    submission public.app_review_submission%ROWTYPE;
BEGIN
    IF p_expected_verification_status NOT IN ('unverified', 'changes_requested')
       OR p_expected_metadata_updated_at IS NULL
       OR p_patch IS NULL
       OR jsonb_typeof(p_patch) <> 'object'
       OR p_patch = '{}'::jsonb
       OR btrim(COALESCE(p_actor_subject, '')) = '' THEN
        RETURN;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM jsonb_object_keys(p_patch) AS patch_key(key)
        WHERE patch_key.key <> ALL (ARRAY[
            'name',
            'short_name',
            'integration_url',
            'category',
            'app_website_url',
            'support_link',
            'description',
            'world_app_description',
            'world_app_button_text',
            'supported_countries',
            'supported_languages',
            'is_android_only',
            'is_developer_allow_listing',
            'is_for_humans_only',
            'app_mode',
            'contracts',
            'permit2_tokens',
            'whitelisted_addresses',
            'associated_domains',
            'can_import_all_contacts',
            'can_use_attestation',
            'is_allowed_unlimited_notifications',
            'max_notifications_per_day',
            'logo_img_url',
            'hero_image_url',
            'meta_tag_image_url',
            'content_card_image_url',
            'showcase_img_urls'
        ]::text[])
    ) THEN
        RAISE EXCEPTION USING
            ERRCODE = '22023',
            MESSAGE = 'MCP metadata patch contains a field that is not editable.';
    END IF;

    PERFORM pg_advisory_xact_lock(hashtextextended(p_app_metadata_id, 0));

    SELECT candidate.*
    INTO metadata
    FROM public.app_metadata AS candidate
    WHERE candidate.id = p_app_metadata_id
    FOR UPDATE;

    IF NOT FOUND
       OR metadata.verification_status IS DISTINCT FROM p_expected_verification_status
       OR metadata.updated_at IS DISTINCT FROM p_expected_metadata_updated_at THEN
        RETURN;
    END IF;

    SELECT populated.*
    INTO patched_metadata
    FROM jsonb_populate_record(metadata, p_patch) AS populated;

    IF metadata.verification_status = 'changes_requested' THEN
        SELECT candidate.*
        INTO submission
        FROM public.app_review_submission AS candidate
        WHERE candidate.app_metadata_id = p_app_metadata_id
          AND candidate.status = 'changes_requested'
        ORDER BY candidate.attempt DESC
        LIMIT 1
        FOR UPDATE;
    END IF;

    UPDATE public.app_metadata
    SET name = patched_metadata.name,
        short_name = patched_metadata.short_name,
        integration_url = patched_metadata.integration_url,
        category = patched_metadata.category,
        app_website_url = patched_metadata.app_website_url,
        support_link = patched_metadata.support_link,
        description = patched_metadata.description,
        world_app_description = patched_metadata.world_app_description,
        world_app_button_text = patched_metadata.world_app_button_text,
        supported_countries = patched_metadata.supported_countries,
        supported_languages = patched_metadata.supported_languages,
        is_android_only = patched_metadata.is_android_only,
        is_developer_allow_listing = patched_metadata.is_developer_allow_listing,
        is_for_humans_only = patched_metadata.is_for_humans_only,
        app_mode = patched_metadata.app_mode,
        contracts = patched_metadata.contracts,
        permit2_tokens = patched_metadata.permit2_tokens,
        whitelisted_addresses = patched_metadata.whitelisted_addresses,
        associated_domains = patched_metadata.associated_domains,
        can_import_all_contacts = patched_metadata.can_import_all_contacts,
        can_use_attestation = patched_metadata.can_use_attestation,
        is_allowed_unlimited_notifications = patched_metadata.is_allowed_unlimited_notifications,
        max_notifications_per_day = patched_metadata.max_notifications_per_day,
        logo_img_url = patched_metadata.logo_img_url,
        hero_image_url = patched_metadata.hero_image_url,
        meta_tag_image_url = patched_metadata.meta_tag_image_url,
        content_card_image_url = patched_metadata.content_card_image_url,
        showcase_img_urls = patched_metadata.showcase_img_urls,
        verification_status = CASE
            WHEN metadata.verification_status = 'changes_requested'
                THEN 'unverified'
            ELSE metadata.verification_status
        END
    WHERE id = p_app_metadata_id
      AND verification_status = p_expected_verification_status
      AND updated_at = p_expected_metadata_updated_at
    RETURNING * INTO updated_metadata;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    IF metadata.verification_status = 'changes_requested'
       AND submission.id IS NOT NULL THEN
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
                'metadata_status_to', 'unverified',
                'edit_committed', true,
                'edited_fields', (
                    SELECT jsonb_agg(patch_field.field_name ORDER BY patch_field.field_name)
                    FROM jsonb_object_keys(p_patch) AS patch_field(field_name)
                )
            )
        );
    END IF;

    RETURN NEXT updated_metadata;
END;
$$;

COMMENT ON FUNCTION public.mcp_patch_editable_app_metadata(text, text, timestamptz, jsonb, text, text) IS
'Atomically applies an MCP metadata patch and reopens a changes-requested draft only when that patch commits.';
