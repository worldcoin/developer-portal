DROP FUNCTION public.developer_withdraw_active_review_draft(
    text,
    timestamptz,
    uuid,
    integer,
    text,
    text
);

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
BEGIN
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
