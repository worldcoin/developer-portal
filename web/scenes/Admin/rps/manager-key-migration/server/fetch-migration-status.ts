// TODO: delete this file after the RP manager key migration completes.
//
// Cleanup checklist:
// 1. Delete web/scenes/Admin/rps/manager-key-migration/.
// 2. Remove the TODO inserts from Admin/rps/page.tsx and Admin/rps/id/page.tsx.
// 3. Remove the native queries and logical models from databases.yaml.
// 4. Revert internal_dashboard_readonly grants for unique/key and audit select.
// 5. Delete web/tests/unit/admin-rp-manager-key-migration-fetch.test.ts.
// 6. Regenerate GraphQL schema/types.

import "server-only";

import { getInternalDashboardGraphqlClient } from "@/api/helpers/graphql";
import { logger } from "@/lib/logger";

import {
  type FetchAdminRpManagerKeyMigrationQuery,
  getSdk,
} from "../graphql/server/fetch-admin-rp-manager-key-migration.generated";
import {
  MigrationQueueKind,
  type AdminRpManagerKeyMigrationQueueItem,
} from "../types";

// #region Types

export type AdminRpManagerKeyMigrationInventory = {
  remainingCronCandidates: number;
  uniqueExcludedFromCron: number;
  onSharedWithAudit: number;
  onSharedWithoutAudit: number;
  uniqueWithAudit: number;
  auditPending: number;
  auditFailed: number;
  auditBlocked: number;
  auditReadyForExternalCleanup: number;
  auditDeletionScheduled: number;
  auditDeleted: number;
  auditDeletionOverdue: number;
};

export type { AdminRpManagerKeyMigrationQueueItem };

export type AdminRpManagerKeyMigrationFlags = {
  migrationEnabled: boolean;
  cleanupEnabled: boolean;
};

export type AdminRpManagerKeyMigrationStatus = {
  flags: AdminRpManagerKeyMigrationFlags;
  inventory: AdminRpManagerKeyMigrationInventory;
  remainingCronCandidates: AdminRpManagerKeyMigrationQueueItem[];
  cleanupNeedsAttention: AdminRpManagerKeyMigrationQueueItem[];
  remainingCronCandidateCount: number;
  cleanupNeedsAttentionCount: number;
};

// #endregion

const toCount = (value: number | string | null | undefined): number => {
  const count = Number(value ?? 0);
  return Number.isFinite(count) ? count : 0;
};

const isMigrationQueueKind = (value: string): value is MigrationQueueKind =>
  Object.values(MigrationQueueKind).some((kind) => kind === value);

// ANCHOR: Map the single-row native query into dashboard inventory counters.
export const mapMigrationInventory = (
  inventory: FetchAdminRpManagerKeyMigrationQuery["inventory"][number],
): AdminRpManagerKeyMigrationInventory => ({
  remainingCronCandidates: toCount(inventory.remaining_cron_candidates),
  uniqueExcludedFromCron: toCount(inventory.unique_excluded_from_cron),
  onSharedWithAudit: toCount(inventory.on_shared_with_audit),
  onSharedWithoutAudit: toCount(inventory.on_shared_without_audit),
  uniqueWithAudit: toCount(inventory.unique_with_audit),
  auditPending: toCount(inventory.audit_pending),
  auditFailed: toCount(inventory.audit_failed),
  auditBlocked: toCount(inventory.audit_blocked),
  auditReadyForExternalCleanup: toCount(
    inventory.audit_ready_for_external_cleanup,
  ),
  auditDeletionScheduled: toCount(inventory.audit_deletion_scheduled),
  auditDeleted: toCount(inventory.audit_deleted),
  auditDeletionOverdue: toCount(inventory.audit_deletion_overdue),
});

// ANCHOR: Split native queue rows by kind and drop unknown kinds.
export const mapMigrationQueues = (
  rows: FetchAdminRpManagerKeyMigrationQuery["queue"],
): {
  remainingCronCandidates: AdminRpManagerKeyMigrationQueueItem[];
  cleanupNeedsAttention: AdminRpManagerKeyMigrationQueueItem[];
  remainingCronCandidateCount: number;
  cleanupNeedsAttentionCount: number;
} => {
  const remainingCronCandidates: AdminRpManagerKeyMigrationQueueItem[] = [];
  const cleanupNeedsAttention: AdminRpManagerKeyMigrationQueueItem[] = [];

  for (const row of rows) {
    if (!isMigrationQueueKind(row.kind)) {
      continue;
    }

    const item: AdminRpManagerKeyMigrationQueueItem = {
      kind: row.kind,
      rpId: row.rp_id,
      appId: row.app_id,
      appName: row.app_name ?? null,
      updatedAt: row.updated_at ?? null,
      cleanupStatus: row.cleanup_status ?? null,
      lastErrorDetail: row.last_error_detail ?? null,
      expectedDeletionAt: row.expected_deletion_at ?? null,
      totalCount: toCount(row.total_count),
    };

    if (row.kind === MigrationQueueKind.RemainingCronCandidate) {
      remainingCronCandidates.push(item);
    } else {
      cleanupNeedsAttention.push(item);
    }
  }

  return {
    remainingCronCandidates,
    cleanupNeedsAttention,
    remainingCronCandidateCount: remainingCronCandidates[0]?.totalCount ?? 0,
    cleanupNeedsAttentionCount: cleanupNeedsAttention[0]?.totalCount ?? 0,
  };
};

// ANCHOR: Read migration/cleanup feature flags from the same Next.js process env.
export const readMigrationFeatureFlags =
  (): AdminRpManagerKeyMigrationFlags => ({
    migrationEnabled: process.env.ENABLE_RP_MANAGER_KEY_MIGRATION === "true",
    cleanupEnabled: process.env.ENABLE_RP_MANAGER_KEY_CLEANUP === "true",
  });

// ANCHOR: Load migration progress counters and attention queues for the admin panel.
export const fetchAdminRpManagerKeyMigration =
  async (): Promise<AdminRpManagerKeyMigrationStatus> => {
    const client = await getInternalDashboardGraphqlClient();

    try {
      const data = await getSdk(client).FetchAdminRpManagerKeyMigration();
      const inventoryRow = data.inventory[0];

      if (!inventoryRow) {
        throw new Error("admin_rp_manager_key_migration returned no rows");
      }

      const queues = mapMigrationQueues(data.queue);

      return {
        flags: readMigrationFeatureFlags(),
        inventory: mapMigrationInventory(inventoryRow),
        ...queues,
      };
    } catch (error) {
      logger.error("Failed to fetch admin RP manager key migration status", {
        error,
      });
      throw error;
    }
  };
