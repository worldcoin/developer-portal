DROP FUNCTION IF EXISTS public.withdraw_listing_review_submission(text, text, text);
DROP FUNCTION IF EXISTS public.capture_listing_review_submission(
    text,
    text,
    text,
    text,
    boolean,
    timestamptz,
    jsonb
);
