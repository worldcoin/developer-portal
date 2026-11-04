-- Hasura v2.47 applies migration SQL inside a transaction, which rules out
-- CREATE INDEX CONCURRENTLY. For a large target, pre-create the same partial
-- index concurrently under this name; IF NOT EXISTS then makes this migration
-- a no-op after its definition has been verified.
CREATE INDEX IF NOT EXISTS "nullifier_hash_int_idx"
  ON "public"."nullifier" USING btree ("nullifier_hash_int")
  WHERE "nullifier_hash_int" IS NOT NULL;
