CREATE TABLE "public"."app_review_submission" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid (),
    "app_metadata_id" varchar NOT NULL,
    "app_id" varchar NOT NULL,
    "team_id" varchar NOT NULL,
    "attempt" integer NOT NULL DEFAULT 1,
    "status" text NOT NULL DEFAULT 'pending',
    "app_mode" text NOT NULL,
    "listing_target" text NOT NULL,
    "listing_consent" boolean NOT NULL,
    "changelog" text NOT NULL DEFAULT '',
    "submitted_at" timestamptz NOT NULL DEFAULT now (),
    "metadata_updated_at" timestamptz NOT NULL,
    "review_version" integer NOT NULL DEFAULT 1,
    "submitted_by_subject" text,
    "submitted_by_email" text,
    "claimed_by_subject" text,
    "claimed_by_email" text,
    "claim_token" uuid,
    "claimed_at" timestamptz,
    "claim_expires_at" timestamptz,
    "checklist_version" text,
    "checklist" jsonb NOT NULL DEFAULT '{}'::jsonb,
    "metadata_snapshot" jsonb NOT NULL,
    "localizations_snapshot" jsonb NOT NULL DEFAULT '[]'::jsonb,
    "decision_summary" text,
    "decided_by_subject" text,
    "decided_by_email" text,
    "decided_at" timestamptz,
    "completed_at" timestamptz,
    "created_at" timestamptz NOT NULL DEFAULT now (),
    "updated_at" timestamptz NOT NULL DEFAULT now (),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("app_id") REFERENCES "public"."app" ("id")
        ON UPDATE restrict ON DELETE restrict,
    FOREIGN KEY ("team_id") REFERENCES "public"."team" ("id")
        ON UPDATE restrict ON DELETE restrict,
    CONSTRAINT "app_review_submission_metadata_attempt_unique"
        UNIQUE ("app_metadata_id", "attempt"),
    CONSTRAINT "app_review_submission_attempt_positive"
        CHECK ("attempt" > 0),
    CONSTRAINT "app_review_submission_review_version_positive"
        CHECK ("review_version" > 0),
    -- Submission status is intentionally separate from app_metadata.verification_status.
    -- Metadata continues to use unverified/awaiting_review/verified/changes_requested.
    CONSTRAINT "app_review_submission_status_check"
        CHECK (
            "status" IN (
                'pending',
                'in_review',
                'changes_requested',
                'approved',
                'withdrawn'
            )
        ),
    CONSTRAINT "app_review_submission_app_mode_check"
        CHECK ("app_mode" IN ('mini-app', 'external')),
    CONSTRAINT "app_review_submission_listing_target_check"
        CHECK ("listing_target" IN ('mini_app_store', 'world_ecosystem')),
    CONSTRAINT "app_review_submission_mode_target_check"
        CHECK (
            ("app_mode" = 'mini-app' AND "listing_target" = 'mini_app_store')
            OR ("app_mode" = 'external' AND "listing_target" = 'world_ecosystem')
        ),
    CONSTRAINT "app_review_submission_checklist_object"
        CHECK (jsonb_typeof("checklist") = 'object'),
    CONSTRAINT "app_review_submission_metadata_snapshot_object"
        CHECK (jsonb_typeof("metadata_snapshot") = 'object'),
    CONSTRAINT "app_review_submission_localizations_snapshot_array"
        CHECK (jsonb_typeof("localizations_snapshot") = 'array'),
    CONSTRAINT "app_review_submission_claim_fields_check"
        CHECK (
            (
                "claim_token" IS NULL
                AND "claimed_by_subject" IS NULL
                AND "claimed_by_email" IS NULL
                AND "claimed_at" IS NULL
                AND "claim_expires_at" IS NULL
            )
            OR (
                "claim_token" IS NOT NULL
                AND "claimed_by_subject" IS NOT NULL
                AND "claimed_by_email" IS NOT NULL
                AND "claimed_at" IS NOT NULL
                AND "claim_expires_at" IS NOT NULL
                AND "claim_expires_at" > "claimed_at"
            )
        )
);

COMMENT ON COLUMN "public"."app_review_submission"."status" IS
'Reviewer workflow status: pending, in_review, changes_requested, approved, or withdrawn.';
COMMENT ON COLUMN "public"."app_review_submission"."app_metadata_id" IS
'Immutable submitted metadata identifier. It intentionally has no foreign key so replacing an old metadata row cannot erase review history.';

CREATE UNIQUE INDEX "app_review_submission_one_active_metadata"
ON "public"."app_review_submission" ("app_metadata_id")
WHERE "status" IN ('pending', 'in_review');

CREATE INDEX "app_review_submission_queue"
ON "public"."app_review_submission" ("status", "submitted_at", "id");

CREATE TRIGGER "set_public_app_review_submission_updated_at"
BEFORE UPDATE ON "public"."app_review_submission"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at" ();

CREATE TABLE "public"."app_review_event" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid (),
    "submission_id" uuid NOT NULL,
    "event_type" text NOT NULL,
    "actor_subject" text,
    "actor_email" text,
    "review_version" integer,
    "payload" jsonb NOT NULL DEFAULT '{}'::jsonb,
    "created_at" timestamptz NOT NULL DEFAULT now (),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("submission_id")
        REFERENCES "public"."app_review_submission" ("id")
        ON UPDATE restrict ON DELETE restrict,
    CONSTRAINT "app_review_event_type_check"
        CHECK (
            "event_type" IN (
                'submitted',
                'claimed',
                'claim_heartbeat',
                'claim_released',
                'claim_expired',
                'checklist_updated',
                'changes_requested',
                'approved',
                'withdrawn',
                'draft_reopened',
                'notification_attempted',
                'notification_delivered',
                'notification_failed',
                'notification_dead_lettered',
                'publication_check_pending',
                'publication_check_succeeded',
                'publication_check_failed'
            )
        ),
    CONSTRAINT "app_review_event_review_version_positive"
        CHECK ("review_version" IS NULL OR "review_version" > 0),
    CONSTRAINT "app_review_event_payload_object"
        CHECK (jsonb_typeof("payload") = 'object')
);

COMMENT ON TABLE "public"."app_review_event" IS
'Append-only reviewer workflow audit log. Hasura grants insert/select only.';
COMMENT ON COLUMN "public"."app_review_event"."event_type" IS
'Submitted, claim, checklist, decision, delivery, and publication audit event domain.';

CREATE INDEX "app_review_event_submission_created_at"
ON "public"."app_review_event" ("submission_id", "created_at", "id");

CREATE UNIQUE INDEX "app_review_event_one_submitted_per_submission"
ON "public"."app_review_event" ("submission_id")
WHERE "event_type" = 'submitted';

CREATE TABLE "public"."app_review_notification" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid (),
    "submission_id" uuid NOT NULL,
    "notification_type" text NOT NULL,
    "channel" text NOT NULL,
    "status" text NOT NULL DEFAULT 'pending',
    "dedupe_key" text NOT NULL,
    "recipient" text,
    "payload" jsonb NOT NULL DEFAULT '{}'::jsonb,
    "provider_message_id" text,
    "attempt_count" integer NOT NULL DEFAULT 0,
    "next_attempt_at" timestamptz NOT NULL DEFAULT now (),
    "locked_at" timestamptz,
    "locked_by" text,
    "last_attempt_at" timestamptz,
    "delivered_at" timestamptz,
    "last_error" text,
    "created_at" timestamptz NOT NULL DEFAULT now (),
    "updated_at" timestamptz NOT NULL DEFAULT now (),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("submission_id")
        REFERENCES "public"."app_review_submission" ("id")
        ON UPDATE restrict ON DELETE restrict,
    CONSTRAINT "app_review_notification_dedupe_key_unique" UNIQUE ("dedupe_key"),
    CONSTRAINT "app_review_notification_type_check"
        CHECK (
            "notification_type" IN (
                'submission_received',
                'decision_approved',
                'decision_changes_requested',
                'publication_check'
            )
        ),
    CONSTRAINT "app_review_notification_channel_check"
        CHECK ("channel" IN ('slack', 'email', 'publication')),
    CONSTRAINT "app_review_notification_status_check"
        CHECK (
            "status" IN (
                'pending',
                'processing',
                'delivered',
                'failed',
                'dead_letter'
            )
        ),
    CONSTRAINT "app_review_notification_attempt_count_nonnegative"
        CHECK ("attempt_count" >= 0),
    CONSTRAINT "app_review_notification_payload_object"
        CHECK (jsonb_typeof("payload") = 'object'),
    CONSTRAINT "app_review_notification_delivery_check"
        CHECK (
            ("status" = 'delivered' AND "delivered_at" IS NOT NULL)
            OR ("status" <> 'delivered' AND "delivered_at" IS NULL)
        )
);

COMMENT ON COLUMN "public"."app_review_notification"."status" IS
'Outbox delivery status: pending, processing, delivered, failed, or dead_letter.';

CREATE INDEX "app_review_notification_delivery_queue"
ON "public"."app_review_notification" ("status", "next_attempt_at", "id")
WHERE "status" IN ('pending', 'failed');

CREATE TRIGGER "set_public_app_review_notification_updated_at"
BEFORE UPDATE ON "public"."app_review_notification"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at" ();

-- Seed only the production-environment listing reviews that belong in the new
-- reviewer queue. Reapplying this statement is safe because the active-row
-- partial unique index turns an existing queue record into a no-op.
INSERT INTO "public"."app_review_submission" (
    "app_metadata_id",
    "app_id",
    "team_id",
    "attempt",
    "status",
    "app_mode",
    "listing_target",
    "listing_consent",
    "changelog",
    "submitted_at",
    "metadata_updated_at",
    "metadata_snapshot",
    "localizations_snapshot"
)
SELECT
    metadata."id",
    metadata."app_id",
    app."team_id",
    1,
    'pending',
    metadata."app_mode",
    CASE metadata."app_mode"
        WHEN 'mini-app' THEN 'mini_app_store'
        ELSE 'world_ecosystem'
    END,
    metadata."is_developer_allow_listing",
    COALESCE(metadata."changelog", ''),
    metadata."updated_at",
    metadata."updated_at",
    to_jsonb(metadata),
    COALESCE(
        (
            SELECT jsonb_agg(
                to_jsonb(localization)
                ORDER BY localization."locale", localization."id"
            )
            FROM "public"."localisations" AS localization
            WHERE localization."app_metadata_id" = metadata."id"
        ),
        '[]'::jsonb
    )
FROM "public"."app_metadata" AS metadata
INNER JOIN "public"."app" AS app ON app."id" = metadata."app_id"
WHERE app."is_staging" = false
  AND app."deleted_at" IS NULL
  AND metadata."verification_status" = 'awaiting_review'
  AND metadata."is_developer_allow_listing" = true
  AND metadata."app_mode" IN ('mini-app', 'external')
ON CONFLICT DO NOTHING;

-- Give rollout-seeded submissions the same immutable lifecycle origin as live
-- captures. The partial unique index makes this safe to rerun.
INSERT INTO "public"."app_review_event" (
    "submission_id",
    "event_type",
    "actor_subject",
    "actor_email",
    "review_version",
    "payload",
    "created_at"
)
SELECT
    submission."id",
    'submitted',
    NULL,
    NULL,
    submission."review_version",
    jsonb_build_object('backfilled', true),
    submission."submitted_at"
FROM "public"."app_review_submission" AS submission
WHERE submission."attempt" = 1
  AND submission."submitted_by_subject" IS NULL
  AND submission."submitted_by_email" IS NULL
ON CONFLICT DO NOTHING;
