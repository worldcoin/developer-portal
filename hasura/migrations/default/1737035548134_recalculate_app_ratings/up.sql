UPDATE app
SET
    rating_sum = (
      SELECT COALESCE(SUM(rating), 0)
      FROM app_reviews
      WHERE app_reviews.app_id = app.id
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM app_reviews
      WHERE app_reviews.app_id = app.id
    );
