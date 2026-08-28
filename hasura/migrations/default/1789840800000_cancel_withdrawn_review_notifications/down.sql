DROP TRIGGER withdraw_app_reviews_on_soft_delete ON public.app;
DROP TRIGGER withdraw_team_reviews_on_soft_delete ON public.team;

DROP FUNCTION public.developer_withdraw_active_review_draft(
    text,
    timestamptz,
    uuid,
    integer,
    text,
    text
);
DROP FUNCTION public.withdraw_app_reviews_on_soft_delete();
DROP FUNCTION public.withdraw_team_reviews_on_soft_delete();
DROP FUNCTION public.withdraw_active_app_reviews_for_ban(
    text,
    text,
    text,
    timestamptz
);
DROP FUNCTION public.withdraw_active_app_reviews_for_transition(
    text,
    text,
    text,
    timestamptz,
    text
);
DROP FUNCTION public.withdraw_active_team_reviews_for_transition(
    text,
    text,
    text,
    timestamptz,
    text
);

DROP FUNCTION public.reviewer_claim_app_review_notifications(text, integer);
DROP FUNCTION public.reviewer_complete_app_review_notification(
    uuid,
    text,
    text,
    text,
    text
);
DROP FUNCTION public.reviewer_retry_app_review_notification(
    uuid,
    uuid,
    text,
    text
);
DROP FUNCTION public.reviewer_begin_app_review_submission_slack_delivery(
    uuid,
    text,
    uuid
);
DROP FUNCTION public.reconcile_terminal_app_review_submission_notifications(integer);

DROP FUNCTION public.reviewer_set_app_review_asset_snapshot(uuid, integer, jsonb);
DROP FUNCTION public.reconcile_app_review_asset_snapshot_repair(uuid, jsonb);

DROP FUNCTION public.reconcile_uncaptured_listing_review_submission(text);
DROP FUNCTION public.reconcile_uncaptured_listing_review_submission_locked(text);
ALTER FUNCTION public.reconcile_uncaptured_listing_review_submission_before_lock_order_fix(text)
RENAME TO reconcile_uncaptured_listing_review_submission;

CREATE OR REPLACE FUNCTION public.bridge_uncaptured_listing_review_submission()
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

DROP FUNCTION public.cancel_app_review_submission_received_notification(
    uuid,
    text,
    text,
    text
);

ALTER FUNCTION public.developer_withdraw_active_review_draft_before_notification_cancellation(
    text,
    timestamptz,
    uuid,
    integer,
    text,
    text
) RENAME TO developer_withdraw_active_review_draft;

ALTER FUNCTION public.withdraw_app_reviews_on_soft_delete_before_lock_order_fix()
RENAME TO withdraw_app_reviews_on_soft_delete;
CREATE TRIGGER withdraw_app_reviews_on_soft_delete
BEFORE UPDATE OF deleted_at ON public.app
FOR EACH ROW
WHEN (OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL)
EXECUTE FUNCTION public.withdraw_app_reviews_on_soft_delete();

ALTER FUNCTION public.withdraw_team_reviews_on_soft_delete_before_lock_order_fix()
RENAME TO withdraw_team_reviews_on_soft_delete;
CREATE TRIGGER withdraw_team_reviews_on_soft_delete
BEFORE UPDATE OF deleted_at ON public.team
FOR EACH ROW
WHEN (OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL)
EXECUTE FUNCTION public.withdraw_team_reviews_on_soft_delete();

ALTER FUNCTION public.withdraw_active_app_reviews_for_ban_before_lock_order_fix(
    text,
    text,
    text,
    timestamptz
) RENAME TO withdraw_active_app_reviews_for_ban;

ALTER FUNCTION public.reviewer_claim_app_review_notifications_before_terminal_fence(
    text,
    integer
) RENAME TO reviewer_claim_app_review_notifications;

ALTER FUNCTION public.reviewer_complete_app_review_notification_before_terminal_fence(
    uuid,
    text,
    text,
    text,
    text
) RENAME TO reviewer_complete_app_review_notification;

ALTER FUNCTION public.reviewer_retry_app_review_notification_before_lock_order_fix(
    uuid,
    uuid,
    text,
    text
) RENAME TO reviewer_retry_app_review_notification;

ALTER FUNCTION public.reviewer_set_app_review_asset_snapshot_before_lock_order_fix(
    uuid,
    integer,
    jsonb
) RENAME TO reviewer_set_app_review_asset_snapshot;

ALTER FUNCTION public.reconcile_app_review_asset_snapshot_repair_before_lock_order_fix(
    uuid,
    jsonb
) RENAME TO reconcile_app_review_asset_snapshot_repair;
