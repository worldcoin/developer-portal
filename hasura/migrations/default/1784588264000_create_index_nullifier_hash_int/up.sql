-- Hasura v2.47 applies migration SQL inside a transaction, which rules out
-- CREATE INDEX CONCURRENTLY. The target table is currently small, so create
-- the index through the repository's standard transactional migration path.
CREATE INDEX IF NOT EXISTS "nullifier_nullifier_hash_int_idx"
  ON "public"."nullifier" USING btree ("nullifier_hash_int");
