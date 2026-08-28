DROP FUNCTION public.reopen_changes_requested_review_draft(
    text,
    text,
    timestamptz,
    text,
    text
);

-- Keep draft_reopened valid after rollback: narrowing the event domain would
-- require deleting immutable audit history written while this migration ran.
