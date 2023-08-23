ALTER TABLE "public"."nullifier"
    DROP COLUMN "merkle_root",
    ADD COLUMN "uses" INT DEFAULT 1,
    ADD CONSTRAINT "unique_nullifier_hash" UNIQUE (nullifier_hash);
