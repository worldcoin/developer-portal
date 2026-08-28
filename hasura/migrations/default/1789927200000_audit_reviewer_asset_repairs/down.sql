DROP TRIGGER IF EXISTS audit_app_review_asset_snapshot_repair_outcome
ON public.app_review_submission;

DROP FUNCTION IF EXISTS public.audit_app_review_asset_snapshot_repair_outcome();

DROP FUNCTION IF EXISTS public.reviewer_begin_app_review_asset_snapshot_repair(
    uuid,
    integer,
    integer,
    uuid
);

-- Preserve the expanded event constraint so immutable repair audit rows remain
-- valid if application code is rolled back after the worker has emitted them.
