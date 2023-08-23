ALTER TABLE "public"."nullifier"
    DROP COLUMN "uses",
    DROP CONSTRAINT "unique_nullifier_hash";
