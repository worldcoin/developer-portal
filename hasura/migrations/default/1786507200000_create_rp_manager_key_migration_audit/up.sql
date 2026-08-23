CREATE TABLE "public"."rp_manager_key_migration_audit" (
  "rp_id" varchar(50) NOT NULL,
  "app_id" varchar(50) NOT NULL,
  "old_manager_kms_key_id" text NOT NULL,
  "old_manager_kms_key_arn" text NOT NULL,
  "shared_manager_kms_key_id" text NOT NULL,
  "cleanup_status" text NOT NULL DEFAULT 'pending',
  "last_error_detail" text,
  "deletion_scheduled_at" timestamptz,
  "expected_deletion_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("rp_id"),
  CONSTRAINT "rp_manager_key_migration_audit_cleanup_status_check" CHECK (
    "cleanup_status" IN (
      'pending',
      'failed',
      'blocked',
      'ready_for_external_cleanup',
      'deletion_scheduled',
      'deleted'
    )
  ),
  CONSTRAINT "rp_manager_key_migration_audit_old_key_arn_key"
    UNIQUE ("old_manager_kms_key_arn")
);

-- No foreign keys by design: this audit and KMS cleanup handoff must survive
-- deletion of the operational app or RP registration rows.

CREATE INDEX "rp_manager_key_migration_audit_cleanup_queue_idx"
  ON "public"."rp_manager_key_migration_audit" (
    "cleanup_status",
    "expected_deletion_at",
    "updated_at"
  );

CREATE TRIGGER "set_public_rp_manager_key_migration_audit_updated_at"
BEFORE UPDATE ON "public"."rp_manager_key_migration_audit"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();

COMMENT ON TABLE "public"."rp_manager_key_migration_audit" IS
  'Maps a migrated RP to its old per-RP manager KMS key for later cleanup.';

COMMENT ON COLUMN "public"."rp_manager_key_migration_audit"."old_manager_kms_key_id" IS
  'The exact KMS identifier stored on rp_registration before migration.';

COMMENT ON COLUMN "public"."rp_manager_key_migration_audit"."old_manager_kms_key_arn" IS
  'Canonical ARN of the old per-RP KMS key used for cleanup and account ownership checks.';
