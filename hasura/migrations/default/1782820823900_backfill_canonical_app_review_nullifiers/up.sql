-- Backfill: collapse legacy duplicate reviews and canonicalize nullifier_hash.
--
-- Before nullifier canonicalization, the un-canonicalized dedup let one person
-- store multiple app_reviews rows for the same app via hex re-encodings
-- (HackerOne #3771446). Collapse those to one row, then normalize every
-- nullifier_hash to canonical "0x" + 64 lowercase hex so future canonical
-- writes match existing rows and the UNIQUE(nullifier_hash) constraint enforces
-- one-review-per-person. The app_reviews_maintain_rating trigger (previous
-- migration) keeps app.rating_sum / rating_count correct as duplicates are
-- deleted.
--
-- Note: normalization assumes ≤ 32-byte values (true for any IDKit-issued
-- nullifier); it strips surrounding whitespace (legacy rows could store an
-- untrimmed value since the old verifier trimmed only for the proof check),
-- lowercases, strips 0x, and left-pads to 64 hex chars — matching the handler's
-- canonicalizeNullifierHash.

-- 1. Delete duplicate rows that canonicalize to the same nullifier (same
--    person + app — the per-app external_nullifier makes the canonical value a
--    unique person+app key), keeping the most recently updated one.
DELETE FROM public.app_reviews ar
USING (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY
        '0x' || lpad(regexp_replace(lower(translate(nullifier_hash, E' \t\n\r\f\v', '')), '^0x', ''), 64, '0')
      ORDER BY updated_at DESC NULLS LAST, id DESC
    ) AS rn
  FROM public.app_reviews
) dup
WHERE ar.id = dup.id
  AND dup.rn > 1;

-- 2. Normalize surviving rows to canonical form (idempotent on already-canonical
--    "0x" + 64-lowercase-hex values).
UPDATE public.app_reviews
SET nullifier_hash =
  '0x' || lpad(regexp_replace(lower(translate(nullifier_hash, E' \t\n\r\f\v', '')), '^0x', ''), 64, '0')
WHERE nullifier_hash IS DISTINCT FROM
  '0x' || lpad(regexp_replace(lower(translate(nullifier_hash, E' \t\n\r\f\v', '')), '^0x', ''), 64, '0');
