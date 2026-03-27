-- Rename tx_hash column to operation_hash in rp_registration table
-- tx_hash was a misnomer; the value stored is the UserOperation hash, not a transaction hash
ALTER TABLE "public"."rp_registration" RENAME COLUMN "tx_hash" TO "operation_hash";
