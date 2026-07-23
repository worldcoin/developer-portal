-- Verification analytics read models + operational tables (PR 1: legacy repair + read models).
-- Four customer read models, identical measure shape, service-role only.
-- action_id is polymorphic (action.id | action_v4.id): deliberately NO FK — deletion triggers
-- maintain consistency instead. Row invariant is database-enforced on all four tables.

CREATE TABLE "public"."action_verification_stats_daily" (
  "action_id" varchar(50) NOT NULL,
  "app_id" varchar(50) NOT NULL,
  "source" text NOT NULL,
  "environment" text NOT NULL,
  "date" date NOT NULL,
  "verifications" bigint NOT NULL DEFAULT 0,
  "unique_verifications" bigint NOT NULL DEFAULT 0,
  "repeated_verifications" bigint NOT NULL DEFAULT 0,
  "latest_verification_at" timestamptz,
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("action_id", "source", "environment", "date"),
  FOREIGN KEY ("app_id") REFERENCES "public"."app"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "action_verification_stats_daily_source_check" CHECK (source IN ('legacy', 'v4')),
  CONSTRAINT "action_verification_stats_daily_environment_check" CHECK (environment IN ('production', 'staging')),
  CONSTRAINT "action_verification_stats_daily_sum_check" CHECK (verifications = unique_verifications + repeated_verifications),
  CONSTRAINT "action_verification_stats_daily_nonnegative_check" CHECK (verifications >= 0 AND unique_verifications >= 0 AND repeated_verifications >= 0)
);

CREATE INDEX "action_verification_stats_daily_app_id_date_idx"
  ON "public"."action_verification_stats_daily" ("app_id", "date");

CREATE TABLE "public"."action_verification_stats_total" (
  "action_id" varchar(50) NOT NULL,
  "app_id" varchar(50) NOT NULL,
  "source" text NOT NULL,
  "environment" text NOT NULL,
  "verifications" bigint NOT NULL DEFAULT 0,
  "unique_verifications" bigint NOT NULL DEFAULT 0,
  "repeated_verifications" bigint NOT NULL DEFAULT 0,
  "latest_verification_at" timestamptz,
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("action_id", "source", "environment"),
  FOREIGN KEY ("app_id") REFERENCES "public"."app"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "action_verification_stats_total_source_check" CHECK (source IN ('legacy', 'v4')),
  CONSTRAINT "action_verification_stats_total_environment_check" CHECK (environment IN ('production', 'staging')),
  CONSTRAINT "action_verification_stats_total_sum_check" CHECK (verifications = unique_verifications + repeated_verifications),
  CONSTRAINT "action_verification_stats_total_nonnegative_check" CHECK (verifications >= 0 AND unique_verifications >= 0 AND repeated_verifications >= 0)
);

CREATE INDEX "action_verification_stats_total_app_id_idx"
  ON "public"."action_verification_stats_total" ("app_id");

CREATE TABLE "public"."app_verification_stats_daily" (
  "app_id" varchar(50) NOT NULL,
  "source" text NOT NULL,
  "environment" text NOT NULL,
  "date" date NOT NULL,
  "verifications" bigint NOT NULL DEFAULT 0,
  "unique_verifications" bigint NOT NULL DEFAULT 0,
  "repeated_verifications" bigint NOT NULL DEFAULT 0,
  "latest_verification_at" timestamptz,
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("app_id", "source", "environment", "date"),
  FOREIGN KEY ("app_id") REFERENCES "public"."app"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "app_verification_stats_daily_source_check" CHECK (source IN ('legacy', 'v4')),
  CONSTRAINT "app_verification_stats_daily_environment_check" CHECK (environment IN ('production', 'staging')),
  CONSTRAINT "app_verification_stats_daily_sum_check" CHECK (verifications = unique_verifications + repeated_verifications),
  CONSTRAINT "app_verification_stats_daily_nonnegative_check" CHECK (verifications >= 0 AND unique_verifications >= 0 AND repeated_verifications >= 0)
);

CREATE TABLE "public"."app_verification_stats_total" (
  "app_id" varchar(50) NOT NULL,
  "source" text NOT NULL,
  "environment" text NOT NULL,
  "verifications" bigint NOT NULL DEFAULT 0,
  "unique_verifications" bigint NOT NULL DEFAULT 0,
  "repeated_verifications" bigint NOT NULL DEFAULT 0,
  "latest_verification_at" timestamptz,
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("app_id", "source", "environment"),
  FOREIGN KEY ("app_id") REFERENCES "public"."app"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "app_verification_stats_total_source_check" CHECK (source IN ('legacy', 'v4')),
  CONSTRAINT "app_verification_stats_total_environment_check" CHECK (environment IN ('production', 'staging')),
  CONSTRAINT "app_verification_stats_total_sum_check" CHECK (verifications = unique_verifications + repeated_verifications),
  CONSTRAINT "app_verification_stats_total_nonnegative_check" CHECK (verifications >= 0 AND unique_verifications >= 0 AND repeated_verifications >= 0)
);

-- Operational tables (untracked in Hasura).

-- Rollup processing progress ONLY; timestamps only.
CREATE TABLE "public"."rollup_watermark" (
  "key" text NOT NULL,
  "last_until" timestamptz NOT NULL,
  "last_success_at" timestamptz,
  PRIMARY KEY ("key")
);

-- Singleton: reconciliation batch cursor.
CREATE TABLE "public"."verification_reconciliation_state" (
  "id" boolean NOT NULL DEFAULT true,
  "last_source" text,
  "last_action_id" text,
  "last_run_at" timestamptz,
  PRIMARY KEY ("id"),
  CONSTRAINT "verification_reconciliation_state_singleton_check" CHECK (id)
);

-- Coverage/cutover timestamps: 'legacy_seed_completed_at', 'legacy_daily_delta_started_at',
-- 'v4_reuse_tracking_started_at' (PR 2, only after full fleet rollout).
CREATE TABLE "public"."verification_analytics_config" (
  "key" text NOT NULL,
  "timestamp_value" timestamptz NOT NULL,
  PRIMARY KEY ("key")
);

-- Return shape for the rollup/reconciliation Hasura mutations (rows are never stored).
CREATE TABLE "public"."verification_job_returning" (
  "job" text NOT NULL,
  "status" text NOT NULL,
  "items" bigint NOT NULL DEFAULT 0,
  "repaired" bigint NOT NULL DEFAULT 0,
  "alerts" bigint NOT NULL DEFAULT 0,
  "detail" text
);
COMMENT ON TABLE "public"."verification_job_returning" IS 'Returning value of rollup_verification_stats / reconcile_verification_stats functions';

-- The 5-minute rollup scans nullifier by updated_at; unindexed until now (wart-2).
-- Preflight prod row count before deploy; switch to CONCURRENTLY out-of-band if the
-- ordinary build no longer fits the accepted stall window.
CREATE INDEX "nullifier_updated_at_idx" ON "public"."nullifier" ("updated_at");
