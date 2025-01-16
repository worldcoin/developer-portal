UPDATE app
SET
    rating_count = (
      SELECT COUNT(*)
      FROM app_reviews
      WHERE app_reviews.app_id = app.id
    );
