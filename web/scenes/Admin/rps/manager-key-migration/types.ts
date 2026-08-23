// TODO: delete this file after the RP manager key migration completes.
//
// Cleanup checklist:
// 1. Delete web/scenes/Admin/rps/manager-key-migration/.
// 2. Remove the TODO inserts from Admin/rps/page.tsx and Admin/rps/id/page.tsx.
// 3. Remove the native queries and logical models from databases.yaml.
// 4. Revert internal_dashboard_readonly grants for unique/key and audit select.
// 5. Delete web/tests/unit/admin-rp-manager-key-migration-fetch.test.ts.
// 6. Regenerate GraphQL schema/types.

export enum MigrationCleanupStatus {
  Pending = "pending",
  Failed = "failed",
  Blocked = "blocked",
  ReadyForExternalCleanup = "ready_for_external_cleanup",
  DeletionScheduled = "deletion_scheduled",
  Deleted = "deleted",
}

export enum MigrationQueueKind {
  RemainingCronCandidate = "remaining_cron_candidate",
  CleanupNeedsAttention = "cleanup_needs_attention",
}

export type AdminRpManagerKeyMigrationQueueItem = {
  kind: MigrationQueueKind;
  rpId: string;
  appId: string;
  appName: string | null;
  updatedAt: string | null;
  cleanupStatus: string | null;
  lastErrorDetail: string | null;
  expectedDeletionAt: string | null;
  totalCount: number;
};
