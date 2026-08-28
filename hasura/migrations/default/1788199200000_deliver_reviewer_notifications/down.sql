DROP FUNCTION public.reviewer_retry_app_review_notification(uuid, text, text);
DROP FUNCTION public.reviewer_complete_app_review_notification(uuid, text, text, text, text);
DROP FUNCTION public.reviewer_claim_app_review_notifications(text, integer);

-- The two Task 7 audit event variants remain valid after rollback. Narrowing
-- the domain would require deleting immutable history, which is forbidden.
