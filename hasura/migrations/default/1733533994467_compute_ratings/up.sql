-- Step 1: Add new columns for the total rating sum and total number of ratings
ALTER TABLE app
ADD COLUMN IF NOT EXISTS rating_sum BIGINT DEFAULT 0;

ALTER TABLE app
ADD COLUMN IF NOT EXISTS rating_count BIGINT DEFAULT 0;

-- Step 2: Update the new columns with the sum of ratings and count of ratings for each app
UPDATE app
SET
    rating_sum = (
        SELECT
            COALESCE(SUM(rating), 0)
        FROM
            app_reviews
        WHERE
            app_reviews.app_id = app.id
    ),
    rating_count = (
        SELECT
            COUNT(*)
        FROM
            app_reviews
        WHERE
            app_reviews.app_id = app.id
    );