BEGIN;

ALTER TABLE "public"."nullifier"
    DROP CONSTRAINT unique_nullifier_hash,
    ADD COLUMN "merkle_root" TEXT NOT NULL;

DO $$
DECLARE
    row_record RECORD;
BEGIN

FOR row_record IN (SELECT * FROM "public"."nullifier" WHERE uses > 1)
    LOOP
        -- Duplicate each row (uses - 1) times
        FOR i IN 1..(row_record.uses - 1)
        LOOP
            INSERT INTO "public"."nullifier" (action_id, created_at, updated_at, nullifier_hash, merkle_root, credential_type)
            VALUES (row_record.action_id, row_record.created_at, row_record.updated_at, row_record.nullifier_hash, row_record.merkle_root, row_record.credential_type);
        END LOOP;
    END LOOP;

    UPDATE "public"."nullifier" SET uses = 1;

END $$;

ALTER TABLE "public"."nullifier" DROP COLUMN "uses";

COMMIT;
