ALTER TABLE public.rp_registration
ADD COLUMN review_configuration_change_kind text;

ALTER TABLE public.rp_registration
ADD CONSTRAINT rp_registration_review_configuration_change_kind_valid
CHECK (
    review_configuration_change_kind IS NULL
    OR review_configuration_change_kind IN (
        'signer_rotation',
        'mode_switch',
        'active_toggle',
        'registration_retry',
        'legacy_unknown'
    )
);

-- A rolling deploy can leave an old pod's status-only configuration claim in
-- flight. Treat every pre-existing pending registration as ambiguous until its
-- normal terminal status reconciliation closes the marker.
UPDATE public.rp_registration
SET review_configuration_change_kind = 'legacy_unknown'
WHERE status = 'pending';

ALTER TABLE public.app_review_submission
ADD COLUMN world_id_configuration_snapshot jsonb;

CREATE FUNCTION public.build_app_review_world_id_configuration_snapshot(
    p_app_id text
)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = pg_catalog, public
AS $$
    SELECT jsonb_build_object(
        'version', 1,
        'config', jsonb_build_object(
            'legacy_actions', COALESCE(
                (
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'id', legacy_action.id,
                            'action', legacy_action.action,
                            'app_flow_on_complete', legacy_action.app_flow_on_complete,
                            'creation_mode', legacy_action.creation_mode,
                            'description', legacy_action.description,
                            'kiosk_enabled', legacy_action.kiosk_enabled,
                            'max_accounts_per_user', legacy_action.max_accounts_per_user,
                            'max_verifications', legacy_action.max_verifications,
                            'name', legacy_action.name,
                            'post_action_deep_link_android', legacy_action.post_action_deep_link_android,
                            'post_action_deep_link_ios', legacy_action.post_action_deep_link_ios,
                            'privacy_policy_uri', legacy_action.privacy_policy_uri,
                            'status', legacy_action.status,
                            'terms_uri', legacy_action.terms_uri,
                            'webhook_uri', legacy_action.webhook_uri,
                            'redirects', COALESCE(
                                (
                                    SELECT jsonb_agg(
                                        jsonb_build_object(
                                            'id', action_redirect.id,
                                            'redirect_uri', action_redirect.redirect_uri
                                        )
                                        ORDER BY action_redirect.id
                                    )
                                    FROM public.redirect AS action_redirect
                                    WHERE action_redirect.action_id = legacy_action.id
                                ),
                                '[]'::jsonb
                            )
                        )
                        ORDER BY legacy_action.id
                    )
                    FROM public.action AS legacy_action
                    WHERE legacy_action.app_id = p_app_id
                ),
                '[]'::jsonb
            ),
            'registrations', COALESCE(
                (
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'rp_id', registration.rp_id,
                            'mode', registration.mode,
                            'signer_address', registration.signer_address,
                            'actions', COALESCE(
                                (
                                    SELECT jsonb_agg(
                                        jsonb_build_object(
                                            'id', registration_action.id,
                                            'action', registration_action.action,
                                            'description', registration_action.description,
                                            'environment', registration_action.environment
                                        )
                                        ORDER BY registration_action.id
                                    )
                                    FROM public.action_v4 AS registration_action
                                    WHERE registration_action.rp_id = registration.rp_id
                                ),
                                '[]'::jsonb
                            )
                        )
                        ORDER BY registration.rp_id
                    )
                    FROM public.rp_registration AS registration
                    WHERE registration.app_id = p_app_id
                ),
                '[]'::jsonb
            )
        ),
        'lifecycle', jsonb_build_object(
            'registrations', COALESCE(
                (
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'rp_id', registration.rp_id,
                            'status', registration.status,
                            'staging_status', registration.staging_status
                        )
                        ORDER BY registration.rp_id
                    )
                    FROM public.rp_registration AS registration
                    WHERE registration.app_id = p_app_id
                ),
                '[]'::jsonb
            )
        )
    );
$$;

CREATE FUNCTION public.capture_app_review_world_id_configuration_snapshot()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
    -- This is the same app-row lock used by the configuration guards. It gives
    -- submission capture a stable point-in-time view without blocking RP status
    -- reconciliation after the review begins.
    PERFORM app_row.id
    FROM public.app AS app_row
    WHERE app_row.id = NEW.app_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION USING
            ERRCODE = '23503',
            MESSAGE = 'Cannot capture World ID configuration for an unknown app.';
    END IF;

    -- Each user-facing RP configuration flow claims this durable marker before
    -- making an external/on-chain change. Do not freeze an obsolete value while
    -- an operation is between its claim and terminal reconciliation.
    IF EXISTS (
        SELECT 1
        FROM public.rp_registration AS registration
        WHERE registration.app_id = NEW.app_id
          AND registration.review_configuration_change_kind IS NOT NULL
    ) THEN
        RAISE EXCEPTION USING
            ERRCODE = '55000',
            MESSAGE = 'World ID configuration is changing; retry submission after it settles.';
    END IF;

    -- Always derive the value in the database. Callers cannot forge a submitted
    -- configuration snapshot through Hasura or a future capture path.
    NEW.world_id_configuration_snapshot :=
        public.build_app_review_world_id_configuration_snapshot(NEW.app_id);
    RETURN NEW;
END;
$$;

CREATE TRIGGER capture_app_review_world_id_configuration_snapshot
BEFORE INSERT ON public.app_review_submission
FOR EACH ROW
EXECUTE FUNCTION public.capture_app_review_world_id_configuration_snapshot();

-- Prevent configuration writes while historical rows are snapshotted. New
-- submissions are already serialized by the app-row lock above.
LOCK TABLE
    public.action,
    public.redirect,
    public.rp_registration,
    public.action_v4
IN SHARE MODE;

UPDATE public.app_review_submission AS submission
SET world_id_configuration_snapshot =
    public.build_app_review_world_id_configuration_snapshot(submission.app_id)
WHERE submission.world_id_configuration_snapshot IS NULL;

ALTER TABLE public.app_review_submission
ALTER COLUMN world_id_configuration_snapshot SET NOT NULL;

ALTER TABLE public.app_review_submission
ADD CONSTRAINT app_review_submission_world_id_configuration_snapshot_valid
CHECK (
    jsonb_typeof(world_id_configuration_snapshot) = 'object'
    AND world_id_configuration_snapshot ->> 'version' = '1'
    AND jsonb_typeof(world_id_configuration_snapshot -> 'config') = 'object'
    AND jsonb_typeof(world_id_configuration_snapshot -> 'lifecycle') = 'object'
);

CREATE FUNCTION public.guard_app_review_world_id_configuration_snapshot()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
DECLARE
    current_snapshot jsonb;
BEGIN
    IF NEW.world_id_configuration_snapshot IS DISTINCT FROM OLD.world_id_configuration_snapshot THEN
        RAISE EXCEPTION USING
            ERRCODE = '55000',
            MESSAGE = 'Submitted World ID configuration snapshots are immutable.';
    END IF;

    IF NEW.status = 'approved' AND OLD.status IS DISTINCT FROM 'approved' THEN
        current_snapshot :=
            public.build_app_review_world_id_configuration_snapshot(OLD.app_id);

        IF current_snapshot -> 'config'
            IS DISTINCT FROM OLD.world_id_configuration_snapshot -> 'config'
        THEN
            RAISE EXCEPTION USING
                ERRCODE = '55000',
                MESSAGE = 'World ID configuration changed after submission; the draft must be resubmitted.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER guard_app_review_world_id_configuration_snapshot
BEFORE UPDATE OF status, world_id_configuration_snapshot
ON public.app_review_submission
FOR EACH ROW
EXECUTE FUNCTION public.guard_app_review_world_id_configuration_snapshot();

CREATE FUNCTION public.guard_active_app_review_configuration(
    p_old_app_id text,
    p_new_app_id text
)
RETURNS void
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
    IF current_setting('reviewer.workflow_bypass', true) = 'on' THEN
        RETURN;
    END IF;

    -- Serialize configuration writes with submission capture. Lock multiple app
    -- rows in a stable order when a relationship is moved between apps.
    PERFORM guarded_app.id
    FROM public.app AS guarded_app
    WHERE guarded_app.id IN (p_old_app_id, p_new_app_id)
    ORDER BY guarded_app.id
    FOR UPDATE;

    IF EXISTS (
        SELECT 1
        FROM public.app_review_submission AS active_submission
        WHERE active_submission.app_id IN (p_old_app_id, p_new_app_id)
          AND active_submission.status IN ('pending', 'in_review')
    ) THEN
        RAISE EXCEPTION USING
            ERRCODE = '55000',
            MESSAGE = 'World ID configuration is frozen during an active listing review.';
    END IF;
END;
$$;

CREATE FUNCTION public.guard_active_app_review_action_write()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
DECLARE
    guarded_old_app_id text;
    guarded_new_app_id text;
BEGIN
    -- Timestamp-only updates do not change reviewer-visible configuration.
    IF TG_OP = 'UPDATE'
       AND (to_jsonb(NEW) - 'updated_at') = (to_jsonb(OLD) - 'updated_at')
    THEN
        RETURN NEW;
    END IF;

    guarded_old_app_id := CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE OLD.app_id END;
    guarded_new_app_id := CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE NEW.app_id END;

    PERFORM public.guard_active_app_review_configuration(
        guarded_old_app_id,
        guarded_new_app_id
    );

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

CREATE FUNCTION public.guard_active_app_review_rp_registration_write()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
DECLARE
    guarded_old_app_id text;
    guarded_new_app_id text;
BEGIN
    -- Old pods claim RP operations by changing only status. Convert that
    -- transition into a durable ambiguous marker before evaluating the active
    -- review fence, so schema-first rollout is safe across mixed versions.
    IF TG_OP = 'UPDATE'
       AND OLD.status IS DISTINCT FROM 'pending'
       AND NEW.status = 'pending'
       AND NEW.review_configuration_change_kind IS NULL
    THEN
        NEW.review_configuration_change_kind := 'legacy_unknown';
    END IF;

    -- Claiming a configuration operation is serialized with submission capture
    -- and rejected before external side effects when a review is active.
    IF TG_OP = 'UPDATE'
       AND (
           (
               OLD.status IS DISTINCT FROM 'pending'
               AND NEW.status = 'pending'
           )
           OR (
               OLD.review_configuration_change_kind IS NULL
               AND NEW.review_configuration_change_kind IS NOT NULL
           )
       )
    THEN
        PERFORM public.guard_active_app_review_configuration(
            OLD.app_id,
            NEW.app_id
        );
    END IF;

    -- Terminal lifecycle reconciliation closes the durable operation marker.
    IF TG_OP = 'UPDATE'
       AND NEW.status IS DISTINCT FROM OLD.status
       AND NEW.status IS DISTINCT FROM 'pending'
    THEN
        NEW.review_configuration_change_kind := NULL;
    END IF;

    -- Status, operation hashes, and managed-key bookkeeping are lifecycle state,
    -- not submitted reviewer configuration. Let those reconcile while a review
    -- is active; signer/mode/ownership changes still require resubmission.
    IF TG_OP = 'UPDATE'
       AND NEW.rp_id IS NOT DISTINCT FROM OLD.rp_id
       AND NEW.app_id IS NOT DISTINCT FROM OLD.app_id
       AND NEW.mode IS NOT DISTINCT FROM OLD.mode
       AND NEW.signer_address IS NOT DISTINCT FROM OLD.signer_address
    THEN
        RETURN NEW;
    END IF;

    guarded_old_app_id := CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE OLD.app_id END;
    guarded_new_app_id := CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE NEW.app_id END;

    PERFORM public.guard_active_app_review_configuration(
        guarded_old_app_id,
        guarded_new_app_id
    );

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

CREATE FUNCTION public.guard_active_app_review_redirect_write()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
DECLARE
    guarded_old_action_id text;
    guarded_new_action_id text;
    guarded_old_app_id text;
    guarded_new_app_id text;
BEGIN
    IF TG_OP = 'UPDATE'
       AND (to_jsonb(NEW) - 'updated_at') = (to_jsonb(OLD) - 'updated_at')
    THEN
        RETURN NEW;
    END IF;

    guarded_old_action_id := CASE
        WHEN TG_OP = 'INSERT' THEN NULL
        ELSE OLD.action_id
    END;
    guarded_new_action_id := CASE
        WHEN TG_OP = 'DELETE' THEN NULL
        ELSE NEW.action_id
    END;

    SELECT legacy_action.app_id
    INTO guarded_old_app_id
    FROM public.action AS legacy_action
    WHERE legacy_action.id = guarded_old_action_id;

    SELECT legacy_action.app_id
    INTO guarded_new_app_id
    FROM public.action AS legacy_action
    WHERE legacy_action.id = guarded_new_action_id;

    PERFORM public.guard_active_app_review_configuration(
        guarded_old_app_id,
        guarded_new_app_id
    );

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

CREATE FUNCTION public.guard_active_app_review_action_v4_write()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
DECLARE
    guarded_old_rp_id text;
    guarded_new_rp_id text;
    guarded_old_app_id text;
    guarded_new_app_id text;
BEGIN
    IF TG_OP = 'UPDATE'
       AND (to_jsonb(NEW) - 'updated_at') = (to_jsonb(OLD) - 'updated_at')
    THEN
        RETURN NEW;
    END IF;

    guarded_old_rp_id := CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE OLD.rp_id END;
    guarded_new_rp_id := CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE NEW.rp_id END;

    SELECT registration.app_id
    INTO guarded_old_app_id
    FROM public.rp_registration AS registration
    WHERE registration.rp_id = guarded_old_rp_id;

    SELECT registration.app_id
    INTO guarded_new_app_id
    FROM public.rp_registration AS registration
    WHERE registration.rp_id = guarded_new_rp_id;

    PERFORM public.guard_active_app_review_configuration(
        guarded_old_app_id,
        guarded_new_app_id
    );

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER guard_active_app_review_action_write
BEFORE INSERT OR UPDATE OR DELETE ON public.action
FOR EACH ROW
EXECUTE FUNCTION public.guard_active_app_review_action_write();

CREATE TRIGGER guard_active_app_review_rp_registration_write
BEFORE INSERT OR UPDATE OR DELETE ON public.rp_registration
FOR EACH ROW
EXECUTE FUNCTION public.guard_active_app_review_rp_registration_write();

CREATE TRIGGER guard_active_app_review_redirect_write
BEFORE INSERT OR UPDATE OR DELETE ON public.redirect
FOR EACH ROW
EXECUTE FUNCTION public.guard_active_app_review_redirect_write();

CREATE TRIGGER guard_active_app_review_action_v4_write
BEFORE INSERT OR UPDATE OR DELETE ON public.action_v4
FOR EACH ROW
EXECUTE FUNCTION public.guard_active_app_review_action_v4_write();

COMMENT ON COLUMN public.app_review_submission.world_id_configuration_snapshot IS
'Immutable World ID configuration and lifecycle state captured at listing submission.';

COMMENT ON COLUMN public.rp_registration.review_configuration_change_kind IS
'Durable claim for a reviewer-visible RP configuration operation; cleared when its lifecycle status leaves pending.';

COMMENT ON FUNCTION public.guard_active_app_review_configuration(text, text) IS
'Prevents reviewer-visible World ID configuration from drifting during an active listing review.';
