BEGIN;

ALTER TABLE "public"."nullifier"
    DROP COLUMN "merkle_root",
    ADD COLUMN uses INT DEFAULT 1;

WITH duplicates AS (
  SELECT nullifier_hash, MIN(id) AS min_id, COUNT(*) AS cnt
  FROM "public"."nullifier"
  GROUP BY nullifier_hash
  HAVING COUNT(*) > 1
)
UPDATE "public"."nullifier"
SET uses = duplicates.cnt
FROM duplicates
WHERE "public"."nullifier"."nullifier_hash" = duplicates.nullifier_hash
AND "public"."nullifier"."id" = duplicates.min_id;

WITH duplicates AS (
  SELECT nullifier_hash, MIN(id) AS min_id
  FROM "public"."nullifier"
  GROUP BY nullifier_hash
  HAVING COUNT(*) > 1
)
DELETE FROM "public"."nullifier"
WHERE (nullifier_hash, id) NOT IN (
  SELECT duplicates.nullifier_hash, duplicates.min_id
  FROM duplicates
);

ALTER TABLE "public"."nullifier" ADD CONSTRAINT unique_nullifier_hash UNIQUE(nullifier_hash);

COMMIT;
