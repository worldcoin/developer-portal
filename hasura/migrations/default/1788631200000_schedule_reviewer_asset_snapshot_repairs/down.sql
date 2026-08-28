DROP FUNCTION public.reviewer_fail_app_review_asset_snapshot_repair(
    uuid,
    integer,
    integer,
    text
);

DROP TRIGGER normalize_app_review_asset_snapshot_repair_state
ON public.app_review_submission;
DROP FUNCTION public.normalize_app_review_asset_snapshot_repair_state();

ALTER TABLE public.app_review_submission
DROP CONSTRAINT app_review_submission_asset_snapshot_repair_schedule_valid,
DROP CONSTRAINT app_review_submission_asset_snapshot_repair_attempt_nonnegative,
DROP COLUMN asset_snapshot_repair_dead_lettered_at,
DROP COLUMN asset_snapshot_repair_last_error,
DROP COLUMN asset_snapshot_repair_next_at,
DROP COLUMN asset_snapshot_repair_attempt_count;
