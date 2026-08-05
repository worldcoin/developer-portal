import "server-only";

import { getEthAddressFromKMS } from "@/api/helpers/kms-eth";
import { submitTransferManagerTransaction } from "@/api/helpers/rp-transactions";
import {
  isValidRpId,
  parseRpId,
  type RpRegistryConfig,
} from "@/api/helpers/rp-utils";
import {
  getRpFromContract,
  type OnChainRelyingParty,
} from "@/api/helpers/temporal-rpc";
import { logger } from "@/lib/logger";
import type { KMSClient } from "@aws-sdk/client-kms";
import { gql, type GraphQLClient } from "graphql-request";

// #region Types

export type RpManagerMigrationRegistry = {
  name: string;
  config: RpRegistryConfig;
};

export type RpManagerMigrationInput = {
  graphqlClient: GraphQLClient;
  kmsClient: KMSClient;
  sharedManagerKeyId: string;
  /** Registry configured as primary in the current Portal deployment. */
  primaryRegistry: RpManagerMigrationRegistry;
  /** Optional additional registry configured by the current deployment. */
  stagingMirrorRegistry?: RpManagerMigrationRegistry;
  rpIds?: readonly string[];
  pollIntervalMs?: number;
  confirmationTimeoutMs?: number;
};

export type RpManagerMigrationFailureStage =
  | "load_old_key"
  | "read_registry"
  | "conflict"
  | "submit_transfer"
  | "wait_for_confirmation"
  | "verify_final_state"
  | "update_database";

export type RpManagerMigrationItemResult = {
  rpId: string;
  appId: string;
  oldManagerKeyId: string;
  operationHashes: Record<string, string>;
  skippedRegistries: string[];
  /**
   * True means this RP no longer uses the old key. A cleanup process must still
   * verify that no other DB row or on-chain RP references it before deletion.
   */
  eligibleForCleanup: boolean;
} & (
  | { status: "migrated" | "already_migrated" }
  | {
      status: "failed";
      failure: {
        stage: RpManagerMigrationFailureStage;
        detail: string;
      };
    }
);

export type RpManagerMigrationReport = {
  sharedManagerKeyId: string;
  sharedManagerAddress: string;
  candidateCount: number;
  results: RpManagerMigrationItemResult[];
};

type MigrationCandidate = {
  rp_id: string;
  app_id: string;
  signer_address: string;
  manager_kms_key_id: string;
  staging_status: string | null;
  staging_operation_hash: string | null;
  updated_at: string;
};

type CandidateQueryResult = {
  rp_registration: MigrationCandidate[];
};

type FinalizeMigrationResult = {
  update_rp_registration: {
    affected_rows: number;
  } | null;
};

type RegistryState = {
  registry: RpManagerMigrationRegistry;
  initialRp: OnChainRelyingParty;
  needsTransfer: boolean;
};

type MigrationContext = {
  graphqlClient: GraphQLClient;
  kmsClient: KMSClient;
  sharedManagerKeyId: string;
  sharedManagerAddress: string;
  primaryRegistry: RpManagerMigrationRegistry;
  stagingMirrorRegistry?: RpManagerMigrationRegistry;
  pollIntervalMs: number;
  confirmationTimeoutMs: number;
};

// #endregion

// #region GraphQL

const MIGRATION_CANDIDATE_FIELDS = gql`
  fragment RpManagerMigrationCandidate on rp_registration {
    rp_id
    app_id
    signer_address
    manager_kms_key_id
    staging_status
    staging_operation_hash
    updated_at
  }
`;

const GET_MIGRATION_CANDIDATES = gql`
  ${MIGRATION_CANDIDATE_FIELDS}
  query GetRpManagerMigrationCandidates {
    rp_registration(
      where: {
        mode: { _eq: managed }
        status: { _eq: registered }
        signer_address: { _is_null: false }
        manager_kms_key_id: { _is_null: false }
        manager_key_dedicated: { _eq: true }
        app: {
          status: { _eq: "active" }
          is_archived: { _eq: false }
          deleted_at: { _is_null: true }
        }
      }
      order_by: { created_at: asc }
    ) {
      ...RpManagerMigrationCandidate
    }
  }
`;

const GET_MIGRATION_CANDIDATES_BY_ID = gql`
  ${MIGRATION_CANDIDATE_FIELDS}
  query GetRpManagerMigrationCandidatesById($rp_ids: [String!]!) {
    rp_registration(
      where: {
        rp_id: { _in: $rp_ids }
        mode: { _eq: managed }
        status: { _eq: registered }
        signer_address: { _is_null: false }
        manager_kms_key_id: { _is_null: false }
        manager_key_dedicated: { _eq: true }
        app: {
          status: { _eq: "active" }
          is_archived: { _eq: false }
          deleted_at: { _is_null: true }
        }
      }
      order_by: { created_at: asc }
    ) {
      ...RpManagerMigrationCandidate
    }
  }
`;

const FINALIZE_MIGRATION = gql`
  mutation FinalizeRpManagerMigration(
    $rp_id: String!
    $signer_address: String!
    $old_manager_key_id: String!
    $shared_manager_key_id: String!
    $expected_updated_at: timestamptz!
  ) {
    update_rp_registration(
      where: {
        rp_id: { _eq: $rp_id }
        mode: { _eq: managed }
        status: { _eq: registered }
        signer_address: { _eq: $signer_address }
        manager_kms_key_id: { _eq: $old_manager_key_id }
        manager_key_dedicated: { _eq: true }
        updated_at: { _eq: $expected_updated_at }
        app: {
          status: { _eq: "active" }
          is_archived: { _eq: false }
          deleted_at: { _is_null: true }
        }
      }
      _set: {
        manager_kms_key_id: $shared_manager_key_id
        manager_key_dedicated: false
      }
    ) {
      affected_rows
    }
  }
`;

// #endregion

// #region Validation and shared helpers

const DEFAULT_POLL_INTERVAL_MS = 2_000;
const DEFAULT_CONFIRMATION_TIMEOUT_MS = 120_000;

function addressesEqual(left: string, right: string): boolean {
  return left.toLowerCase() === right.toLowerCase();
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

function assertValidInput(input: RpManagerMigrationInput): void {
  if (!input.sharedManagerKeyId.trim()) {
    throw new Error("sharedManagerKeyId must not be empty");
  }

  const registryNames = new Set<string>();
  const registries = [
    input.primaryRegistry,
    ...(input.stagingMirrorRegistry ? [input.stagingMirrorRegistry] : []),
  ];
  for (const registry of registries) {
    const name = registry.name.trim();
    if (!name) {
      throw new Error("Registry name must not be empty");
    }
    if (registryNames.has(name)) {
      throw new Error(`Duplicate registry name: ${name}`);
    }
    registryNames.add(name);
  }

  if (
    input.stagingMirrorRegistry &&
    addressesEqual(
      input.primaryRegistry.config.contractAddress,
      input.stagingMirrorRegistry.config.contractAddress,
    )
  ) {
    throw new Error(
      "Primary and staging mirror registries must use different contracts",
    );
  }

  if (input.rpIds) {
    for (const rpId of input.rpIds) {
      if (!isValidRpId(rpId)) {
        throw new Error(`Invalid RP ID: ${rpId}`);
      }
    }
  }

  if ((input.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS) < 0) {
    throw new Error("pollIntervalMs must not be negative");
  }

  if ((input.confirmationTimeoutMs ?? DEFAULT_CONFIRMATION_TIMEOUT_MS) < 0) {
    throw new Error("confirmationTimeoutMs must not be negative");
  }
}

async function sleep(ms: number): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function failedResult(
  candidate: MigrationCandidate,
  operationHashes: Record<string, string>,
  stage: RpManagerMigrationFailureStage,
  detail: string,
  skippedRegistries: string[] = [],
): RpManagerMigrationItemResult {
  logger.error("RP manager key migration failed", {
    rpId: candidate.rp_id,
    appId: candidate.app_id,
    stage,
    detail,
  });

  return {
    rpId: candidate.rp_id,
    appId: candidate.app_id,
    oldManagerKeyId: candidate.manager_kms_key_id,
    operationHashes,
    skippedRegistries,
    eligibleForCleanup: false,
    status: "failed",
    failure: { stage, detail },
  };
}

async function loadCandidates(
  graphqlClient: GraphQLClient,
  rpIds?: readonly string[],
): Promise<MigrationCandidate[]> {
  if (rpIds?.length === 0) {
    return [];
  }

  const response = rpIds
    ? await graphqlClient.request<CandidateQueryResult, { rp_ids: string[] }>(
        GET_MIGRATION_CANDIDATES_BY_ID,
        { rp_ids: [...new Set(rpIds)] },
      )
    : await graphqlClient.request<CandidateQueryResult>(
        GET_MIGRATION_CANDIDATES,
      );

  return response.rp_registration;
}

// #endregion

// #region On-chain migration

function validateRegistryState(
  registryName: string,
  rp: OnChainRelyingParty,
  expectedSignerAddress: string,
  oldManagerAddress: string,
  sharedManagerAddress: string,
): string | null {
  if (!rp.initialized) {
    return `RP is not initialized in registry ${registryName}`;
  }
  if (!rp.active) {
    return `RP is inactive in registry ${registryName}`;
  }
  if (!addressesEqual(rp.signer, expectedSignerAddress)) {
    return `RP signer changed in registry ${registryName}`;
  }
  if (
    !addressesEqual(rp.manager, oldManagerAddress) &&
    !addressesEqual(rp.manager, sharedManagerAddress)
  ) {
    return `RP has an unexpected manager in registry ${registryName}`;
  }
  return null;
}

async function waitForSharedManager({
  rpId,
  registry,
  initialSignerAddress,
  oldManagerAddress,
  sharedManagerAddress,
  pollIntervalMs,
  confirmationTimeoutMs,
}: {
  rpId: bigint;
  registry: RpManagerMigrationRegistry;
  initialSignerAddress: string;
  oldManagerAddress: string;
  sharedManagerAddress: string;
  pollIntervalMs: number;
  confirmationTimeoutMs: number;
}): Promise<void> {
  const deadline = Date.now() + confirmationTimeoutMs;

  while (true) {
    const rp = await getRpFromContract(rpId, registry.config.contractAddress);

    if (!rp.initialized || !rp.active) {
      throw new Error(`RP state changed in registry ${registry.name}`);
    }
    if (!addressesEqual(rp.signer, initialSignerAddress)) {
      throw new Error(`RP signer changed in registry ${registry.name}`);
    }
    if (addressesEqual(rp.manager, sharedManagerAddress)) {
      return;
    }
    if (!addressesEqual(rp.manager, oldManagerAddress)) {
      throw new Error(
        `RP has an unexpected manager in registry ${registry.name}`,
      );
    }
    if (Date.now() >= deadline) {
      throw new Error(
        `Timed out waiting for manager update in registry ${registry.name}`,
      );
    }

    await sleep(pollIntervalMs);
  }
}

async function migrateCandidate(
  context: MigrationContext,
  candidate: MigrationCandidate,
): Promise<RpManagerMigrationItemResult> {
  const operationHashes: Record<string, string> = {};
  const skippedRegistries: string[] = [];

  if (!isValidRpId(candidate.rp_id)) {
    return failedResult(
      candidate,
      operationHashes,
      "conflict",
      "Registration contains an invalid RP ID",
    );
  }

  const rpId = parseRpId(candidate.rp_id);

  let oldManagerAddress: string;
  try {
    oldManagerAddress = await getEthAddressFromKMS(
      context.kmsClient,
      candidate.manager_kms_key_id,
    );
  } catch (error) {
    return failedResult(
      candidate,
      operationHashes,
      "load_old_key",
      errorMessage(error),
    );
  }

  const registryStates: RegistryState[] = [];
  let absentStagingMirror: RpManagerMigrationRegistry | null = null;
  const registryTargets = [
    { registry: context.primaryRegistry, isStagingMirror: false },
    ...(context.stagingMirrorRegistry
      ? [
          {
            registry: context.stagingMirrorRegistry,
            isStagingMirror: true,
          },
        ]
      : []),
  ];

  for (const { registry, isStagingMirror } of registryTargets) {
    let initialRp: OnChainRelyingParty;
    try {
      initialRp = await getRpFromContract(
        rpId,
        registry.config.contractAddress,
      );
    } catch (error) {
      return failedResult(
        candidate,
        operationHashes,
        "read_registry",
        `${registry.name}: ${errorMessage(error)}`,
      );
    }

    if (!initialRp.initialized && isStagingMirror) {
      if (candidate.staging_status !== null) {
        const operationDetail = candidate.staging_operation_hash
          ? `, operation ${candidate.staging_operation_hash}`
          : "";
        return failedResult(
          candidate,
          operationHashes,
          "conflict",
          `RP is not initialized in staging mirror ${registry.name}, but the database staging status is ${candidate.staging_status}${operationDetail}`,
        );
      }

      absentStagingMirror = registry;
      skippedRegistries.push(registry.name);
      continue;
    }

    if (
      isStagingMirror &&
      candidate.staging_status !== null &&
      candidate.staging_status !== "registered"
    ) {
      const operationDetail = candidate.staging_operation_hash
        ? `, operation ${candidate.staging_operation_hash}`
        : "";
      return failedResult(
        candidate,
        operationHashes,
        "conflict",
        `Staging mirror ${registry.name} is not settled: database status is ${candidate.staging_status}${operationDetail}`,
      );
    }

    const conflict = validateRegistryState(
      registry.name,
      initialRp,
      candidate.signer_address,
      oldManagerAddress,
      context.sharedManagerAddress,
    );
    if (conflict) {
      return failedResult(candidate, operationHashes, "conflict", conflict);
    }

    registryStates.push({
      registry,
      initialRp,
      needsTransfer: !addressesEqual(
        initialRp.manager,
        context.sharedManagerAddress,
      ),
    });
  }

  for (const state of registryStates.filter((item) => item.needsTransfer)) {
    let operationHash: string;
    try {
      operationHash = await submitTransferManagerTransaction(
        state.registry.config,
        {
          rpId,
          newManagerAddress: context.sharedManagerAddress,
          managerKmsKeyId: candidate.manager_kms_key_id,
          kmsClient: context.kmsClient,
        },
      );
      operationHashes[state.registry.name] = operationHash;
    } catch (error) {
      return failedResult(
        candidate,
        operationHashes,
        "submit_transfer",
        `${state.registry.name}: ${errorMessage(error)}`,
        skippedRegistries,
      );
    }

    try {
      await waitForSharedManager({
        rpId,
        registry: state.registry,
        initialSignerAddress: state.initialRp.signer,
        oldManagerAddress,
        sharedManagerAddress: context.sharedManagerAddress,
        pollIntervalMs: context.pollIntervalMs,
        confirmationTimeoutMs: context.confirmationTimeoutMs,
      });
    } catch (error) {
      return failedResult(
        candidate,
        operationHashes,
        "wait_for_confirmation",
        errorMessage(error),
        skippedRegistries,
      );
    }
  }

  for (const state of registryStates) {
    try {
      const finalRp = await getRpFromContract(
        rpId,
        state.registry.config.contractAddress,
      );
      if (
        !finalRp.initialized ||
        !finalRp.active ||
        !addressesEqual(finalRp.signer, state.initialRp.signer) ||
        !addressesEqual(finalRp.manager, context.sharedManagerAddress)
      ) {
        return failedResult(
          candidate,
          operationHashes,
          "verify_final_state",
          `RP final state does not match expectations in registry ${state.registry.name}`,
          skippedRegistries,
        );
      }
    } catch (error) {
      return failedResult(
        candidate,
        operationHashes,
        "verify_final_state",
        `${state.registry.name}: ${errorMessage(error)}`,
        skippedRegistries,
      );
    }
  }

  // A historical production RP may legitimately predate staging mirroring.
  // Re-read an initially absent mirror immediately before the DB write so a
  // concurrent registration cannot appear after our first check and be left
  // under the old manager key.
  if (absentStagingMirror) {
    try {
      const finalStagingRp = await getRpFromContract(
        rpId,
        absentStagingMirror.config.contractAddress,
      );
      if (finalStagingRp.initialized) {
        return failedResult(
          candidate,
          operationHashes,
          "verify_final_state",
          `RP appeared in staging mirror ${absentStagingMirror.name} during migration`,
          skippedRegistries,
        );
      }
    } catch (error) {
      return failedResult(
        candidate,
        operationHashes,
        "verify_final_state",
        `${absentStagingMirror.name}: ${errorMessage(error)}`,
        skippedRegistries,
      );
    }
  }

  try {
    const response = await context.graphqlClient.request<
      FinalizeMigrationResult,
      {
        rp_id: string;
        signer_address: string;
        old_manager_key_id: string;
        shared_manager_key_id: string;
        expected_updated_at: string;
      }
    >(FINALIZE_MIGRATION, {
      rp_id: candidate.rp_id,
      signer_address: candidate.signer_address,
      old_manager_key_id: candidate.manager_kms_key_id,
      shared_manager_key_id: context.sharedManagerKeyId,
      expected_updated_at: candidate.updated_at,
    });

    if (response.update_rp_registration?.affected_rows !== 1) {
      return failedResult(
        candidate,
        operationHashes,
        "update_database",
        "Registration changed concurrently; conditional update affected no rows",
        skippedRegistries,
      );
    }
  } catch (error) {
    return failedResult(
      candidate,
      operationHashes,
      "update_database",
      errorMessage(error),
      skippedRegistries,
    );
  }

  const status =
    Object.keys(operationHashes).length === 0 ? "already_migrated" : "migrated";

  logger.info("RP manager key migration completed", {
    rpId: candidate.rp_id,
    appId: candidate.app_id,
    status,
    migratedRegistries: Object.keys(operationHashes),
    skippedRegistries,
  });

  return {
    rpId: candidate.rp_id,
    appId: candidate.app_id,
    oldManagerKeyId: candidate.manager_kms_key_id,
    operationHashes,
    skippedRegistries,
    eligibleForCleanup: !addressesEqual(
      oldManagerAddress,
      context.sharedManagerAddress,
    ),
    status,
  };
}

// #endregion

// #region Public API

/**
 * Migrates managed RPs from dedicated manager KMS keys to one shared key.
 *
 * The function is intentionally transport-agnostic: a separate caller passes
 * dependencies from the current deployment configuration and selects RP IDs.
 * If that configuration contains a staging mirror, the migration verifies and
 * migrates it too; historical RPs that genuinely predate the mirror may skip
 * it. The function never schedules old KMS keys for deletion. Run only one
 * instance at a time and prevent concurrent manager operations for the
 * selected RPs while it runs.
 */
export async function migrateRpManagersToSharedKey(
  input: RpManagerMigrationInput,
): Promise<RpManagerMigrationReport> {
  assertValidInput(input);

  const sharedManagerKeyId = input.sharedManagerKeyId.trim();
  const sharedManagerAddress = await getEthAddressFromKMS(
    input.kmsClient,
    sharedManagerKeyId,
  );
  const candidates = await loadCandidates(input.graphqlClient, input.rpIds);

  const context: MigrationContext = {
    graphqlClient: input.graphqlClient,
    kmsClient: input.kmsClient,
    sharedManagerKeyId,
    sharedManagerAddress,
    primaryRegistry: input.primaryRegistry,
    stagingMirrorRegistry: input.stagingMirrorRegistry,
    pollIntervalMs: input.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS,
    confirmationTimeoutMs:
      input.confirmationTimeoutMs ?? DEFAULT_CONFIRMATION_TIMEOUT_MS,
  };

  const results: RpManagerMigrationItemResult[] = [];
  for (const candidate of candidates) {
    results.push(await migrateCandidate(context, candidate));
  }

  return {
    sharedManagerKeyId,
    sharedManagerAddress,
    candidateCount: candidates.length,
    results,
  };
}

// #endregion
