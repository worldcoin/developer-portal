BEGIN;

ALTER TABLE "public"."nullifier"
    DROP COLUMN "merkle_root",
    ADD COLUMN uses INT DEFAULT 1;

CREATE TEMPORARY TABLE duplicates ON COMMIT DROP AS (
  SELECT nullifier_hash, MIN(created_at) AS min_created_at, COUNT(*) AS cnt
  FROM "public"."nullifier"
  GROUP BY nullifier_hash
  HAVING COUNT(*) > 1
);

-- get the earliest record for each nullifier_hash
CREATE TEMPORARY TABLE earliest ON COMMIT DROP AS (
  SELECT id, nullifier_hash, created_at
  FROM "public"."nullifier"
  WHERE (nullifier_hash, created_at) IN (SELECT nullifier_hash, min_created_at FROM duplicates)
);

-- update the main nullifier_hash record with the appropriate number of uses
UPDATE "public"."nullifier"
SET uses = duplicates.cnt
FROM duplicates, earliest
WHERE "public"."nullifier".id = earliest.id
AND earliest.nullifier_hash = duplicates.nullifier_hash;

-- remove all but the earliest record for each nullifier_hash
DELETE FROM "public"."nullifier"
WHERE nullifier_hash IN (SELECT nullifier_hash FROM duplicates)
AND id NOT IN (SELECT id FROM earliest);

-- add the uniqueness constraint
ALTER TABLE "public"."nullifier" ADD CONSTRAINT unique_nullifier_hash UNIQUE(nullifier_hash);

COMMIT;
