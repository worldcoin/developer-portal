-- Revert: Rename operation_hash back to tx_hash
ALTER TABLE "public"."rp_registration" RENAME COLUMN "operation_hash" TO "tx_hash";
