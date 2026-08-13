const mockFetchAdminRpManagerKeyMigration = jest.fn();
const mockFetchAdminRpManagerKeyAudit = jest.fn();

jest.mock("server-only", () => ({}));

jest.mock("@/api/helpers/graphql", () => ({
  getInternalDashboardGraphqlClient: jest.fn().mockResolvedValue({}),
}));

jest.mock(
  "@/scenes/Admin/rps/manager-key-migration/graphql/server/fetch-admin-rp-manager-key-migration.generated",
  () => ({
    getSdk: () => ({
      FetchAdminRpManagerKeyMigration: mockFetchAdminRpManagerKeyMigration,
    }),
  }),
);

jest.mock(
  "@/scenes/Admin/rps/manager-key-migration/graphql/server/fetch-admin-rp-manager-key-audit.generated",
  () => ({
    getSdk: () => ({
      FetchAdminRpManagerKeyAudit: mockFetchAdminRpManagerKeyAudit,
    }),
  }),
);

jest.mock("@/lib/logger", () => ({
  logger: {
    error: jest.fn(),
  },
}));

import { logger } from "@/lib/logger";
import {
  fetchAdminRpManagerKeyMigration,
  mapMigrationInventory,
  mapMigrationQueues,
  readMigrationFeatureFlags,
} from "@/scenes/Admin/rps/manager-key-migration/server/fetch-migration-status";
import { fetchAdminRpManagerKeyAudit } from "@/scenes/Admin/rps/manager-key-migration/server/fetch-rp-migration-audit";
import { MigrationQueueKind } from "@/scenes/Admin/rps/manager-key-migration/types";

describe("admin RP manager key migration fetch", () => {
  const originalMigrationFlag = process.env.ENABLE_RP_MANAGER_KEY_MIGRATION;
  const originalCleanupFlag = process.env.ENABLE_RP_MANAGER_KEY_CLEANUP;

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.ENABLE_RP_MANAGER_KEY_MIGRATION;
    delete process.env.ENABLE_RP_MANAGER_KEY_CLEANUP;
  });

  afterAll(() => {
    if (originalMigrationFlag === undefined) {
      delete process.env.ENABLE_RP_MANAGER_KEY_MIGRATION;
    } else {
      process.env.ENABLE_RP_MANAGER_KEY_MIGRATION = originalMigrationFlag;
    }

    if (originalCleanupFlag === undefined) {
      delete process.env.ENABLE_RP_MANAGER_KEY_CLEANUP;
    } else {
      process.env.ENABLE_RP_MANAGER_KEY_CLEANUP = originalCleanupFlag;
    }
  });

  it("maps inventory counters including bigint strings", () => {
    expect(
      mapMigrationInventory({
        remaining_cron_candidates: "17",
        unique_excluded_from_cron: 2,
        on_shared_with_audit: "55",
        on_shared_without_audit: 72,
        unique_with_audit: "3",
        audit_pending: 58,
        audit_failed: "1",
        audit_blocked: 0,
        audit_ready_for_external_cleanup: "4",
        audit_deletion_scheduled: 5,
        audit_deleted: "6",
        audit_deletion_overdue: 1,
      }),
    ).toEqual({
      remainingCronCandidates: 17,
      uniqueExcludedFromCron: 2,
      onSharedWithAudit: 55,
      onSharedWithoutAudit: 72,
      uniqueWithAudit: 3,
      auditPending: 58,
      auditFailed: 1,
      auditBlocked: 0,
      auditReadyForExternalCleanup: 4,
      auditDeletionScheduled: 5,
      auditDeleted: 6,
      auditDeletionOverdue: 1,
    });
  });

  it("splits queue rows by kind and ignores unknown kinds", () => {
    expect(
      mapMigrationQueues([
        {
          kind: MigrationQueueKind.RemainingCronCandidate,
          rp_id: "rp_aaaaaaaaaaaaaaaa",
          app_id: "app_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          app_name: "Alpha",
          updated_at: "2026-08-13T00:00:00.000Z",
          cleanup_status: null,
          last_error_detail: null,
          expected_deletion_at: null,
          total_count: "17",
        },
        {
          kind: "unknown_kind",
          rp_id: "rp_bbbbbbbbbbbbbbbb",
          app_id: "app_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
          app_name: "Ignore",
          updated_at: null,
          cleanup_status: null,
          last_error_detail: null,
          expected_deletion_at: null,
          total_count: 1,
        },
        {
          kind: MigrationQueueKind.CleanupNeedsAttention,
          rp_id: "rp_cccccccccccccccc",
          app_id: "app_cccccccccccccccccccccccccccccccc",
          app_name: "Blocked",
          updated_at: "2026-08-12T00:00:00.000Z",
          cleanup_status: "blocked",
          last_error_detail: "tag mismatch",
          expected_deletion_at: null,
          total_count: 2,
        },
      ]),
    ).toEqual({
      remainingCronCandidates: [
        {
          kind: MigrationQueueKind.RemainingCronCandidate,
          rpId: "rp_aaaaaaaaaaaaaaaa",
          appId: "app_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          appName: "Alpha",
          updatedAt: "2026-08-13T00:00:00.000Z",
          cleanupStatus: null,
          lastErrorDetail: null,
          expectedDeletionAt: null,
          totalCount: 17,
        },
      ],
      cleanupNeedsAttention: [
        {
          kind: MigrationQueueKind.CleanupNeedsAttention,
          rpId: "rp_cccccccccccccccc",
          appId: "app_cccccccccccccccccccccccccccccccc",
          appName: "Blocked",
          updatedAt: "2026-08-12T00:00:00.000Z",
          cleanupStatus: "blocked",
          lastErrorDetail: "tag mismatch",
          expectedDeletionAt: null,
          totalCount: 2,
        },
      ],
      remainingCronCandidateCount: 17,
      cleanupNeedsAttentionCount: 2,
    });
  });

  it("reads feature flags only when set to true", () => {
    expect(readMigrationFeatureFlags()).toEqual({
      migrationEnabled: false,
      cleanupEnabled: false,
    });

    process.env.ENABLE_RP_MANAGER_KEY_MIGRATION = "true";
    process.env.ENABLE_RP_MANAGER_KEY_CLEANUP = "false";

    expect(readMigrationFeatureFlags()).toEqual({
      migrationEnabled: true,
      cleanupEnabled: false,
    });
  });

  it("fetches and maps migration status", async () => {
    process.env.ENABLE_RP_MANAGER_KEY_CLEANUP = "true";
    mockFetchAdminRpManagerKeyMigration.mockResolvedValue({
      inventory: [
        {
          remaining_cron_candidates: 17,
          unique_excluded_from_cron: 0,
          on_shared_with_audit: 55,
          on_shared_without_audit: 72,
          unique_with_audit: 3,
          audit_pending: 58,
          audit_failed: 0,
          audit_blocked: 0,
          audit_ready_for_external_cleanup: 0,
          audit_deletion_scheduled: 0,
          audit_deleted: 0,
          audit_deletion_overdue: 0,
        },
      ],
      queue: [
        {
          kind: MigrationQueueKind.RemainingCronCandidate,
          rp_id: "rp_dddddddddddddddd",
          app_id: "app_dddddddddddddddddddddddddddddddd",
          app_name: "Stuck",
          updated_at: "2026-08-11T00:00:00.000Z",
          cleanup_status: null,
          last_error_detail: null,
          expected_deletion_at: null,
          total_count: 17,
        },
      ],
    });

    await expect(fetchAdminRpManagerKeyMigration()).resolves.toEqual({
      flags: {
        migrationEnabled: false,
        cleanupEnabled: true,
      },
      inventory: {
        remainingCronCandidates: 17,
        uniqueExcludedFromCron: 0,
        onSharedWithAudit: 55,
        onSharedWithoutAudit: 72,
        uniqueWithAudit: 3,
        auditPending: 58,
        auditFailed: 0,
        auditBlocked: 0,
        auditReadyForExternalCleanup: 0,
        auditDeletionScheduled: 0,
        auditDeleted: 0,
        auditDeletionOverdue: 0,
      },
      remainingCronCandidates: [
        expect.objectContaining({
          rpId: "rp_dddddddddddddddd",
          totalCount: 17,
        }),
      ],
      cleanupNeedsAttention: [],
      remainingCronCandidateCount: 17,
      cleanupNeedsAttentionCount: 0,
    });
  });

  it("throws when the inventory native query returns no rows", async () => {
    mockFetchAdminRpManagerKeyMigration.mockResolvedValue({
      inventory: [],
      queue: [],
    });

    await expect(fetchAdminRpManagerKeyMigration()).rejects.toThrow(
      "admin_rp_manager_key_migration returned no rows",
    );
    expect(logger.error).toHaveBeenCalled();
  });

  it("rethrows GraphQL errors from the migration status query", async () => {
    mockFetchAdminRpManagerKeyMigration.mockRejectedValue(
      new Error("hasura unavailable"),
    );

    await expect(fetchAdminRpManagerKeyMigration()).rejects.toThrow(
      "hasura unavailable",
    );
    expect(logger.error).toHaveBeenCalled();
  });

  it("maps RP audit detail when an audit row exists", async () => {
    mockFetchAdminRpManagerKeyAudit.mockResolvedValue({
      rp_registration_by_pk: {
        is_unique_manager_key: false,
        manager_kms_key_id: "arn:aws:kms:eu-west-1:1:key/shared",
      },
      rp_manager_key_migration_audit_by_pk: {
        rp_id: "rp_eeeeeeeeeeeeeeee",
        app_id: "app_eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        old_manager_kms_key_id: "old-key",
        old_manager_kms_key_arn: "arn:aws:kms:eu-west-1:1:key/old",
        shared_manager_kms_key_id: "arn:aws:kms:eu-west-1:1:key/shared",
        cleanup_status: "pending",
        last_error_detail: null,
        deletion_scheduled_at: null,
        expected_deletion_at: null,
        created_at: "2026-08-10T00:00:00.000Z",
        updated_at: "2026-08-11T00:00:00.000Z",
      },
    });

    await expect(
      fetchAdminRpManagerKeyAudit("rp_eeeeeeeeeeeeeeee"),
    ).resolves.toEqual({
      isUniqueManagerKey: false,
      managerKmsKeyId: "arn:aws:kms:eu-west-1:1:key/shared",
      audit: {
        rpId: "rp_eeeeeeeeeeeeeeee",
        appId: "app_eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        oldManagerKmsKeyId: "old-key",
        oldManagerKmsKeyArn: "arn:aws:kms:eu-west-1:1:key/old",
        sharedManagerKmsKeyId: "arn:aws:kms:eu-west-1:1:key/shared",
        cleanupStatus: "pending",
        lastErrorDetail: null,
        deletionScheduledAt: null,
        expectedDeletionAt: null,
        createdAt: "2026-08-10T00:00:00.000Z",
        updatedAt: "2026-08-11T00:00:00.000Z",
      },
    });
  });

  it("returns audit null when the RP has no audit row", async () => {
    mockFetchAdminRpManagerKeyAudit.mockResolvedValue({
      rp_registration_by_pk: {
        is_unique_manager_key: false,
        manager_kms_key_id: "arn:aws:kms:eu-west-1:1:key/shared",
      },
      rp_manager_key_migration_audit_by_pk: null,
    });

    await expect(
      fetchAdminRpManagerKeyAudit("rp_ffffffffffffffff"),
    ).resolves.toEqual({
      isUniqueManagerKey: false,
      managerKmsKeyId: "arn:aws:kms:eu-west-1:1:key/shared",
      audit: null,
    });
  });

  it("returns null when the RP does not exist", async () => {
    mockFetchAdminRpManagerKeyAudit.mockResolvedValue({
      rp_registration_by_pk: null,
      rp_manager_key_migration_audit_by_pk: null,
    });

    await expect(
      fetchAdminRpManagerKeyAudit("rp_0000000000000000"),
    ).resolves.toBeNull();
  });
});
