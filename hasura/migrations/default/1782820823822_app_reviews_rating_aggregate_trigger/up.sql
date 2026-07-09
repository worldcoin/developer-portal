-- Maintain app.rating_sum / app.rating_count transactionally from app_reviews.
--
-- The application layer previously kept these counters with read-modify-write
-- increments, which corrupts the aggregate under concurrent inserts/edits
-- (HackerOne #3703658 + Codex review). A row-level trigger runs inside the
-- writing transaction and serializes concurrent writers on the app row's UPDATE
-- lock, so the aggregate cannot be corrupted, and OLD.rating is read atomically
-- on edits (no TOCTOU).

-- One-time recompute: repair any drift left by the previous increment logic and
-- establish a correct baseline for the incremental trigger below.
UPDATE public.app a
SET rating_sum = COALESCE(r.sum_rating, 0),
    rating_count = COALESCE(r.cnt, 0)
FROM (
  SELECT app_id, SUM(rating) AS sum_rating, COUNT(*) AS cnt
  FROM public.app_reviews
  GROUP BY app_id
) r
WHERE a.id = r.app_id
  AND (
    COALESCE(a.rating_sum, 0) <> COALESCE(r.sum_rating, 0)
    OR COALESCE(a.rating_count, 0) <> COALESCE(r.cnt, 0)
  );

-- Apps with no reviews but non-zero counters: reset to zero.
UPDATE public.app a
SET rating_sum = 0, rating_count = 0
WHERE NOT EXISTS (
    SELECT 1 FROM public.app_reviews ar WHERE ar.app_id = a.id
  )
  AND (COALESCE(a.rating_sum, 0) <> 0 OR COALESCE(a.rating_count, 0) <> 0);

CREATE OR REPLACE FUNCTION public.app_reviews_maintain_rating()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.app
    SET rating_sum = COALESCE(rating_sum, 0) + NEW.rating,
        rating_count = COALESCE(rating_count, 0) + 1
    WHERE id = NEW.app_id;
  ELSIF (TG_OP = 'UPDATE') THEN
    IF (NEW.app_id = OLD.app_id) THEN
      -- Rating edit: adjust by the delta; OLD.rating is read atomically here.
      UPDATE public.app
      SET rating_sum = COALESCE(rating_sum, 0) + NEW.rating - OLD.rating
      WHERE id = NEW.app_id;
    ELSE
      -- Review moved between apps (not expected, but stay correct).
      UPDATE public.app
      SET rating_sum = COALESCE(rating_sum, 0) - OLD.rating,
          rating_count = COALESCE(rating_count, 0) - 1
      WHERE id = OLD.app_id;
      UPDATE public.app
      SET rating_sum = COALESCE(rating_sum, 0) + NEW.rating,
          rating_count = COALESCE(rating_count, 0) + 1
      WHERE id = NEW.app_id;
    END IF;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.app
    SET rating_sum = COALESCE(rating_sum, 0) - OLD.rating,
        rating_count = COALESCE(rating_count, 0) - 1
    WHERE id = OLD.app_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS app_reviews_maintain_rating ON public.app_reviews;
CREATE TRIGGER app_reviews_maintain_rating
AFTER INSERT OR UPDATE OR DELETE ON public.app_reviews
FOR EACH ROW
EXECUTE FUNCTION public.app_reviews_maintain_rating();
