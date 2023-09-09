BEGIN;

ALTER TABLE "public"."nullifier" DROP CONSTRAINT unique_nullifier_hash;

WITH duplicates AS (
  SELECT id, nullifier_hash, uses
  FROM "public"."nullifier"
  WHERE uses > 1
)
INSERT INTO "public"."nullifier" (action_id, created_at, updated_at, nullifier_hash, merkle_root, credential_type)
SELECT y.action_id, y.created_at, y.updated_at, y.nullifier_hash, y.merkle_root, y.credential_type
FROM duplicates x
JOIN "public"."nullifier" y ON x.id = y.id, generate_series(1, x.uses - 1);

UPDATE "public"."nullifier" SET uses = 1;

ALTER TABLE "public"."nullifier"
    DROP COLUMN "uses",
    DROP CONSTRAINT "unique_nullifier_hash";

COMMIT;
