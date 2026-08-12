import "server-only";

import { getEthAddressFromKMS } from "@/api/helpers/kms-eth";
import {
  isValidRpId,
  parseRpId,
  type RpRegistryConfig,
} from "@/api/helpers/rp-utils";
import { getRpFromContract } from "@/api/helpers/temporal-rpc";
import { logger } from "@/lib/logger";
import {
  DescribeKeyCommand,
  type KeyMetadata,
  type KMSClient,
  ListResourceTagsCommand,
  ScheduleKeyDeletionCommand,
} from "@aws-sdk/client-kms";
import { gql, type GraphQLClient } from "graphql-request";

// #region Public types

export type RpManagerKeyCleanupRegistry = {
  name: string;
  config: RpRegistryConfig;
};

export type RpManagerKeyCleanupInput = {
  graphqlClient: GraphQLClient;
  kmsClient: KMSClient;
  primaryRegistry: RpManagerKeyCleanupRegistry;
  stagingMirrorRegistry?: RpManagerKeyCleanupRegistry;
  rpIds?: readonly string[];
  limit?: number;
  deletionWindowInDays?: number;
};

export enum CleanupStatus {
  Pending = "pending",
  Failed = "failed",
  Blocked = "blocked",
  ReadyForExternalCleanup = "ready_for_external_cleanup",
  DeletionScheduled = "deletion_scheduled",
  Deleted = "deleted",
}

export type RpManagerKeyCleanupItemResult = {
  rpId: string;
  appId: string;
  oldManagerKeyArn: string;
  status:
    | CleanupStatus.Blocked
    | CleanupStatus.ReadyForExternalCleanup
    | CleanupStatus.DeletionScheduled
    | CleanupStatus.Deleted
    | CleanupStatus.Failed
    | "skipped";
  detail?: string;
  expectedDeletionAt?: string;
};

export type RpManagerKeyCleanupReport = {
  candidateCount: number;
  results: RpManagerKeyCleanupItemResult[];
};

// #endregion

// #region Internal types

export type ManagerKeyCleanupCandidate = {
  rp_id: string;
  app_id: string;
  old_manager_kms_key_id: string;
  old_manager_kms_key_arn: string;
  shared_manager_kms_key_id: string;
  cleanup_status: CleanupStatus;
};

type CleanupCandidatesResult = {
  rp_manager_key_migration_audit: ManagerKeyCleanupCandidate[];
};

type ManagerKeyReferenceStateResult = {
  rp_registration: Array<{
    manager_kms_key_id: string | null;
    is_unique_manager_key: boolean;
    staging_status: string | null;
  }>;
  old_key_references: Array<{ rp_id: string }>;
  duplicate_audits: Array<{ rp_id: string }>;
};

type UpdateAuditResult = {
  update_rp_manager_key_migration_audit_by_pk: {
    rp_id: string;
  } | null;
};

export enum PlanStep {
  Skip = "skip",
  MarkAsBlocked = "mark_as_blocked",
  MarkAsReadyForExternalCleanup = "mark_as_ready_for_external_cleanup",
  ScheduleDeletion = "schedule_deletion",
  RecordExistingDeletionSchedule = "record_existing_deletion_schedule",
  MarkAsDeleted = "mark_as_deleted",
}

export type ManagerKeyCleanupPlan =
  | { nextStep: PlanStep.Skip; reason: string }
  | { nextStep: PlanStep.MarkAsBlocked; reason: string }
  | { nextStep: PlanStep.MarkAsReadyForExternalCleanup }
  | { nextStep: PlanStep.ScheduleDeletion }
  | { nextStep: PlanStep.RecordExistingDeletionSchedule; deletionDate: string }
  | { nextStep: PlanStep.MarkAsDeleted };

// #endregion

// #region Actions

const DEFAULT_DELETION_WINDOW_DAYS = 30;
const DEFAULT_CANDIDATE_LIMIT = 1;

// ANCHOR: Compare two Ethereum addresses without checksum casing differences.
function addressesEqual(left: string, right: string): boolean {
  return left.toLowerCase() === right.toLowerCase();
}

// ANCHOR: Check whether KMS reports that a requested key no longer exists.
function isKmsNotFound(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "NotFoundException"
  );
}

// ANCHOR: Reject invalid cleanup limits, deletion windows, and RP IDs.
export function assertValidRpManagerKeyCleanupInput(
  input: RpManagerKeyCleanupInput,
): void {
  const limit = input.limit ?? DEFAULT_CANDIDATE_LIMIT;
  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error("limit must be a positive integer");
  }

  const deletionWindow =
    input.deletionWindowInDays ?? DEFAULT_DELETION_WINDOW_DAYS;
  if (
    !Number.isInteger(deletionWindow) ||
    deletionWindow < 7 ||
    deletionWindow > 30
  ) {
    throw new Error("deletionWindowInDays must be between 7 and 30");
  }

  for (const rpId of input.rpIds ?? []) {
    if (!isValidRpId(rpId)) {
      throw new Error(`Invalid RP ID: ${rpId}`);
    }
  }
}

// ANCHOR: Load audit rows whose cleanup status is pending, failed, or due.
export async function loadCleanupCandidates(
  input: RpManagerKeyCleanupInput,
): Promise<ManagerKeyCleanupCandidate[]> {
  if (input.rpIds?.length === 0) {
    return [];
  }

  const variables = {
    now: new Date().toISOString(),
    limit: input.limit ?? DEFAULT_CANDIDATE_LIMIT,
    retryable_cleanup_statuses: [CleanupStatus.Pending, CleanupStatus.Failed],
    deletion_scheduled_status: CleanupStatus.DeletionScheduled,
  };

  const candidateFields = gql`
    fragment RpManagerKeyCleanupCandidate on rp_manager_key_migration_audit {
      rp_id
      app_id
      old_manager_kms_key_id
      old_manager_kms_key_arn
      shared_manager_kms_key_id
      cleanup_status
    }
  `;

  if (input.rpIds) {
    const response = await input.graphqlClient.request<
      CleanupCandidatesResult,
      {
        rp_ids: string[];
        now: string;
        limit: number;
        retryable_cleanup_statuses: CleanupStatus[];
        deletion_scheduled_status: CleanupStatus;
      }
    >(
      gql`
        ${candidateFields}
        query GetRpManagerKeyCleanupCandidatesById(
          $rp_ids: [String!]!
          $now: timestamptz!
          $limit: Int!
          $retryable_cleanup_statuses: [String!]!
          $deletion_scheduled_status: String!
        ) {
          rp_manager_key_migration_audit(
            where: {
              rp_id: { _in: $rp_ids }
              _or: [
                { cleanup_status: { _in: $retryable_cleanup_statuses } }
                {
                  cleanup_status: { _eq: $deletion_scheduled_status }
                  expected_deletion_at: { _lte: $now }
                }
              ]
            }
            order_by: [{ updated_at: asc }, { created_at: asc }]
            limit: $limit
          ) {
            ...RpManagerKeyCleanupCandidate
          }
        }
      `,
      {
        ...variables,
        rp_ids: [...new Set(input.rpIds)],
      },
    );

    return response.rp_manager_key_migration_audit;
  }

  const response = await input.graphqlClient.request<
    CleanupCandidatesResult,
    {
      now: string;
      limit: number;
      retryable_cleanup_statuses: CleanupStatus[];
      deletion_scheduled_status: CleanupStatus;
    }
  >(
    gql`
      ${candidateFields}
      query GetRpManagerKeyCleanupCandidates(
        $now: timestamptz!
        $limit: Int!
        $retryable_cleanup_statuses: [String!]!
        $deletion_scheduled_status: String!
      ) {
        rp_manager_key_migration_audit(
          where: {
            _or: [
              { cleanup_status: { _in: $retryable_cleanup_statuses } }
              {
                cleanup_status: { _eq: $deletion_scheduled_status }
                expected_deletion_at: { _lte: $now }
              }
            ]
          }
          order_by: [{ updated_at: asc }, { created_at: asc }]
          limit: $limit
        ) {
          ...RpManagerKeyCleanupCandidate
        }
      }
    `,
    variables,
  );

  return response.rp_manager_key_migration_audit;
}

// ANCHOR: Load KMS metadata required by cleanup ownership and type checks.
async function loadKeyMetadata(
  kmsClient: KMSClient,
  keyId: string,
): Promise<KeyMetadata> {
  const { KeyMetadata: metadata } = await kmsClient.send(
    new DescribeKeyCommand({ KeyId: keyId }),
  );

  if (!metadata?.Arn || !metadata.AWSAccountId) {
    throw new Error(`KMS returned incomplete metadata for ${keyId}`);
  }

  return metadata;
}

// ANCHOR: Skip in-flight migrations and block duplicate old-key audit rows.
async function findDatabaseCleanupPlan(
  input: RpManagerKeyCleanupInput,
  candidate: ManagerKeyCleanupCandidate,
): Promise<
  | Extract<ManagerKeyCleanupPlan, { nextStep: PlanStep.Skip }>
  | Extract<ManagerKeyCleanupPlan, { nextStep: PlanStep.MarkAsBlocked }>
  | { stagingStatus: string | null }
> {
  const state = await input.graphqlClient.request<
    ManagerKeyReferenceStateResult,
    {
      rp_id: string;
      old_key_references: string[];
      old_manager_key_arn: string;
    }
  >(
    gql`
      query GetRpManagerKeyCleanupDatabaseState(
        $rp_id: String!
        $old_key_references: [String!]!
        $old_manager_key_arn: String!
      ) {
        rp_registration(where: { rp_id: { _eq: $rp_id } }) {
          manager_kms_key_id
          is_unique_manager_key
          staging_status
        }
        old_key_references: rp_registration(
          where: { manager_kms_key_id: { _in: $old_key_references } }
          limit: 2
        ) {
          rp_id
        }
        duplicate_audits: rp_manager_key_migration_audit(
          where: { old_manager_kms_key_arn: { _eq: $old_manager_key_arn } }
          limit: 2
        ) {
          rp_id
        }
      }
    `,
    {
      rp_id: candidate.rp_id,
      old_key_references: [
        ...new Set([
          candidate.old_manager_kms_key_id,
          candidate.old_manager_kms_key_arn,
        ]),
      ],
      old_manager_key_arn: candidate.old_manager_kms_key_arn,
    },
  );

  if (state.old_key_references.length > 0) {
    return {
      nextStep: PlanStep.Skip,
      reason: "The old manager key is still referenced by an RP registration",
    };
  }

  if (state.duplicate_audits.length !== 1) {
    return {
      nextStep: PlanStep.MarkAsBlocked,
      reason:
        "The old manager key is referenced by multiple migration audit rows",
    };
  }

  return {
    stagingStatus: state.rp_registration[0]?.staging_status ?? null,
  };
}

// ANCHOR: Block cleanup when a registry still uses the old manager address.
async function findRegistryCleanupBlocker(
  input: RpManagerKeyCleanupInput,
  candidate: ManagerKeyCleanupCandidate,
  stagingStatus: string | null,
): Promise<Extract<
  ManagerKeyCleanupPlan,
  { nextStep: PlanStep.MarkAsBlocked }
> | null> {
  const [sharedManagerAddress, oldManagerAddress] = await Promise.all([
    getEthAddressFromKMS(input.kmsClient, candidate.shared_manager_kms_key_id),
    getEthAddressFromKMS(input.kmsClient, candidate.old_manager_kms_key_arn),
  ]);
  const rpId = parseRpId(candidate.rp_id);
  const registries = [
    { registry: input.primaryRegistry, primary: true },
    ...(input.stagingMirrorRegistry
      ? [{ registry: input.stagingMirrorRegistry, primary: false }]
      : []),
  ];

  for (const { registry, primary } of registries) {
    const rp = await getRpFromContract(rpId, registry.config.contractAddress);

    if (!rp.initialized) {
      if (!primary && stagingStatus === null) {
        continue;
      }

      return {
        nextStep: PlanStep.MarkAsBlocked,
        reason: `RP is not initialized in registry ${registry.name}`,
      };
    }

    if (addressesEqual(rp.manager, oldManagerAddress)) {
      return {
        nextStep: PlanStep.MarkAsBlocked,
        reason: `RP still uses the old manager in registry ${registry.name}`,
      };
    }
  }

  return null;
}

// ANCHOR: Block cleanup when the old key is a protected key or the wrong type.
async function findProtectedOrInvalidKeyBlocker(
  input: RpManagerKeyCleanupInput,
  candidate: ManagerKeyCleanupCandidate,
  oldManagerKey: KeyMetadata,
): Promise<
  | Extract<ManagerKeyCleanupPlan, { nextStep: PlanStep.MarkAsBlocked }>
  | { currentAccountId: string }
> {
  const protectedManagerKeys = await Promise.all([
    loadKeyMetadata(input.kmsClient, candidate.shared_manager_kms_key_id),
    loadKeyMetadata(
      input.kmsClient,
      input.primaryRegistry.config.safeOwnerKmsKeyId,
    ),
    ...(input.stagingMirrorRegistry
      ? [
          loadKeyMetadata(
            input.kmsClient,
            input.stagingMirrorRegistry.config.safeOwnerKmsKeyId,
          ),
        ]
      : []),
  ]);

  if (protectedManagerKeys.some((key) => key.Arn === oldManagerKey.Arn)) {
    return {
      nextStep: PlanStep.MarkAsBlocked,
      reason: "The old manager key is a protected shared or Safe owner key",
    };
  }

  if (
    oldManagerKey.KeySpec !== "ECC_SECG_P256K1" ||
    oldManagerKey.KeyUsage !== "SIGN_VERIFY"
  ) {
    return {
      nextStep: PlanStep.MarkAsBlocked,
      reason: "The old manager key is not an ECC signing key",
    };
  }

  const currentAccountId = protectedManagerKeys[0].AWSAccountId;
  if (!currentAccountId) {
    throw new Error("KMS did not return the current AWS account ID");
  }

  return {
    currentAccountId,
  };
}

// ANCHOR: Choose deletion, external handoff, or tag-based blocking for a safe key.
async function determineKmsCleanupPlan(
  input: RpManagerKeyCleanupInput,
  candidate: ManagerKeyCleanupCandidate,
  oldManagerKey: KeyMetadata,
  currentAccountId: string,
): Promise<ManagerKeyCleanupPlan> {
  if (oldManagerKey.KeyState === "PendingDeletion") {
    if (!oldManagerKey.DeletionDate) {
      throw new Error("PendingDeletion key has no deletion date");
    }

    return {
      nextStep: PlanStep.RecordExistingDeletionSchedule,
      deletionDate: oldManagerKey.DeletionDate.toISOString(),
    };
  }

  if (oldManagerKey.AWSAccountId !== currentAccountId) {
    return {
      nextStep: PlanStep.MarkAsReadyForExternalCleanup,
    };
  }

  const { Tags = [] } = await input.kmsClient.send(
    new ListResourceTagsCommand({ KeyId: oldManagerKey.Arn }),
  );
  const tags = new Map(Tags.map((tag) => [tag.TagKey, tag.TagValue]));

  if (
    tags.get("app") !== "developer-portal" ||
    tags.get("rpId") !== candidate.rp_id
  ) {
    return {
      nextStep: PlanStep.MarkAsBlocked,
      reason: "The old manager key does not have the expected ownership tags",
    };
  }

  return {
    nextStep: PlanStep.ScheduleDeletion,
  };
}

// ANCHOR: Run all safety checks and select the next cleanup action.
export async function determineCleanupPlan(
  input: RpManagerKeyCleanupInput,
  candidate: ManagerKeyCleanupCandidate,
): Promise<ManagerKeyCleanupPlan> {
  const databasePlan = await findDatabaseCleanupPlan(input, candidate);

  if ("nextStep" in databasePlan) {
    return databasePlan;
  }

  let oldManagerKey: KeyMetadata;

  try {
    oldManagerKey = await loadKeyMetadata(
      input.kmsClient,
      candidate.old_manager_kms_key_arn,
    );
  } catch (error) {
    if (
      isKmsNotFound(error) &&
      candidate.cleanup_status === CleanupStatus.DeletionScheduled
    ) {
      return {
        nextStep: PlanStep.MarkAsDeleted,
      };
    }

    throw error;
  }

  const protectedOrInvalid = await findProtectedOrInvalidKeyBlocker(
    input,
    candidate,
    oldManagerKey,
  );
  if ("nextStep" in protectedOrInvalid) {
    return protectedOrInvalid;
  }

  const registryBlocker = await findRegistryCleanupBlocker(
    input,
    candidate,
    databasePlan.stagingStatus,
  );
  if (registryBlocker) {
    return registryBlocker;
  }

  return determineKmsCleanupPlan(
    input,
    candidate,
    oldManagerKey,
    protectedOrInvalid.currentAccountId,
  );
}

// ANCHOR: Schedule the old manager key for deletion after the configured waiting period.
export async function scheduleOldKeyDeletion(
  input: RpManagerKeyCleanupInput,
  candidate: ManagerKeyCleanupCandidate,
): Promise<string> {
  const response = await input.kmsClient.send(
    new ScheduleKeyDeletionCommand({
      KeyId: candidate.old_manager_kms_key_arn,
      PendingWindowInDays:
        input.deletionWindowInDays ?? DEFAULT_DELETION_WINDOW_DAYS,
    }),
  );

  if (!response.DeletionDate) {
    throw new Error("KMS did not return the scheduled deletion date");
  }

  return response.DeletionDate.toISOString();
}

// ANCHOR: Persist the final status and details of one cleanup attempt.
export async function recordCleanupOutcome(
  input: RpManagerKeyCleanupInput,
  candidate: ManagerKeyCleanupCandidate,
  outcome: {
    status: Exclude<RpManagerKeyCleanupItemResult["status"], "skipped">;
    detail?: string;
    deletionScheduledAt?: string;
    expectedDeletionAt?: string;
  },
): Promise<void> {
  const response = await input.graphqlClient.request<
    UpdateAuditResult,
    {
      rp_id: string;
      cleanup_status: CleanupStatus;
      last_error_detail?: string;
      deletion_scheduled_at?: string;
      expected_deletion_at?: string;
    }
  >(
    gql`
      mutation RecordRpManagerKeyCleanupOutcome(
        $rp_id: String!
        $cleanup_status: String!
        $last_error_detail: String
        $deletion_scheduled_at: timestamptz
        $expected_deletion_at: timestamptz
      ) {
        update_rp_manager_key_migration_audit_by_pk(
          pk_columns: { rp_id: $rp_id }
          _set: {
            cleanup_status: $cleanup_status
            last_error_detail: $last_error_detail
            deletion_scheduled_at: $deletion_scheduled_at
            expected_deletion_at: $expected_deletion_at
          }
        ) {
          rp_id
        }
      }
    `,
    {
      rp_id: candidate.rp_id,
      cleanup_status: outcome.status,
      last_error_detail: outcome.detail,
      deletion_scheduled_at: outcome.deletionScheduledAt,
      expected_deletion_at: outcome.expectedDeletionAt,
    },
  );

  if (!response.update_rp_manager_key_migration_audit_by_pk) {
    throw new Error("Cleanup audit row no longer exists");
  }

  logger.info("RP manager key cleanup outcome recorded", {
    rp_id: candidate.rp_id,
    old_manager_kms_key_arn: candidate.old_manager_kms_key_arn,
    cleanup_status: outcome.status,
    detail: outcome.detail,
  });
}

// #endregion
