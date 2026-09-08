-- A table-wide UNIQUE(asc_email) let any authenticated portal user permanently
-- claim a third party's Apple Account: once the row existed no admin or
-- self-service transition released the address, because rejected and revoked
-- rows kept occupying the constraint.
--
-- Scope uniqueness to the rows that still hold a live claim on the address.
-- Two approved (or in-flight) enrollments still cannot share one Apple
-- Account, but rejecting or revoking a request now releases it for its owner.
--
-- Hasura runs a migration inside one transaction, so CONCURRENTLY is
-- unavailable and every lock taken here is held until commit. Order the
-- statements so the long one runs under the weak lock:
--
--   CREATE UNIQUE INDEX takes SHARE, which blocks writers but not readers.
--   ALTER TABLE ... DROP CONSTRAINT takes ACCESS EXCLUSIVE, which blocks
--   everything, but it is a catalog update with no data to scan.
--
-- Building the index first therefore confines ACCESS EXCLUSIVE to the final,
-- constant-time statement. Dropping first would hold ACCESS EXCLUSIVE across
-- the build as well, blocking reads for its whole duration.
--
-- Building the partial index while the table-wide constraint still stands can
-- never fail on data: uniqueness over every row implies uniqueness over the
-- live subset.
--
-- The table is small (created one migration earlier, at most one row per
-- portal user), so the build is cheap -- but bound the locks anyway. Without
-- lock_timeout a single long-running reader would park the ACCESS EXCLUSIVE
-- request in the lock queue and every later query on the table would queue
-- behind it. statement_timeout is a ceiling, not a target: fail the migration
-- fast rather than block the table, and retry.
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '30s';

-- The replacement keeps the old object's name. Postgres surfaces that name in
-- the unique_violation it raises, and the running application matches on it to
-- answer a duplicate address with 409 instead of 500. Migrations and pods roll
-- out independently, so pods predating this migration keep serving against the
-- new schema; renaming the object would make them misread every expected
-- conflict as an unexpected error. Holding the name also keeps Hasura's
-- generated constraint enum stable.
--
-- The name is occupied until the constraint is dropped, so build under a
-- temporary one and rename once it is free. Both catalog statements are
-- constant-time, so ACCESS EXCLUSIVE still only covers the tail.
CREATE UNIQUE INDEX IF NOT EXISTS "sandbox_access_request_ios_live_asc_email_key"
    ON "public"."sandbox_access_request_ios" ("asc_email")
    WHERE "status" IN ('pending', 'approving', 'approved', 'revoking');

ALTER TABLE "public"."sandbox_access_request_ios"
    DROP CONSTRAINT IF EXISTS "unique_sandbox_access_request_ios_asc_email";

ALTER INDEX "public"."sandbox_access_request_ios_live_asc_email_key"
    RENAME TO "unique_sandbox_access_request_ios_asc_email";
