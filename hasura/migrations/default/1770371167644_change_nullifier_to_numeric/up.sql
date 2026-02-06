ALTER TABLE "public"."nullifier_v4"
    ALTER COLUMN "nullifier" TYPE numeric(78,0)
    USING "nullifier"::numeric(78,0);
