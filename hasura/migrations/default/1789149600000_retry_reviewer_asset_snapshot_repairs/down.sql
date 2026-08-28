DROP FUNCTION public.reviewer_retry_app_review_asset_snapshot_repair(
    uuid,
    uuid,
    text,
    text
);

-- Keep asset_snapshot_repair_retry_requested valid after rollback: immutable
-- audit rows written while this migration ran cannot be deleted.
