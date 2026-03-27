ALTER TABLE "public"."nullifier_v4"
    ALTER COLUMN "nullifier" TYPE text
    USING "nullifier"::text;
