-- PR 2: per-nullifier counters for World ID 4.0 (plan section 3).
-- uses/updated_at mirror the legacy nullifier shape; existing rows backfill
-- updated_at = created_at so "last verification activity" stays truthful for
-- rows that have never been reused (the old handler never incremented anything).

ALTER TABLE "public"."nullifier_v4"
  ADD COLUMN "uses" integer NOT NULL DEFAULT 1;

ALTER TABLE "public"."nullifier_v4"
  ADD COLUMN "updated_at" timestamptz NOT NULL DEFAULT now();

UPDATE "public"."nullifier_v4" SET "updated_at" = "created_at";

CREATE TRIGGER "set_public_nullifier_v4_updated_at"
BEFORE UPDATE ON "public"."nullifier_v4"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();

COMMENT ON TRIGGER "set_public_nullifier_v4_updated_at" ON "public"."nullifier_v4"
IS 'trigger to set value of column "updated_at" to current timestamp on row update';

-- Last-seen snapshot per v4 nullifier (delta source for the rollup).
CREATE TABLE "public"."nullifier_v4_uses_seen" (
  "nullifier_v4_id" varchar(50) NOT NULL,
  "last_seen_uses" integer NOT NULL,
  "last_seen_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("nullifier_v4_id"),
  FOREIGN KEY ("nullifier_v4_id") REFERENCES "public"."nullifier_v4"("id")
    ON UPDATE CASCADE ON DELETE CASCADE
);

-- Rollup window scans + the recent-activity feed ordering (updated_at, NOT created_at:
-- a reuse updates an existing row and must resurface). Preflight prod row counts before
-- deploy; switch to CONCURRENTLY out-of-band if an ordinary build no longer fits the
-- accepted stall window.
CREATE INDEX "nullifier_v4_updated_at_idx"
  ON "public"."nullifier_v4" ("updated_at");

CREATE INDEX "nullifier_v4_action_v4_id_updated_at_idx"
  ON "public"."nullifier_v4" ("action_v4_id", "updated_at" DESC, "id" DESC);
