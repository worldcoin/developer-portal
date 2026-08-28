DROP TRIGGER guard_reviewer_approval_unbanned_app
ON public.app_review_submission;
DROP FUNCTION public.guard_reviewer_approval_unbanned_app();

DROP TRIGGER withdraw_app_reviews_on_ban ON public.app;
DROP FUNCTION public.withdraw_app_reviews_on_ban();
DROP FUNCTION public.withdraw_active_app_reviews_for_ban(text, text, text, timestamptz);
