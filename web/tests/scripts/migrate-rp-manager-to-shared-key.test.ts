import type { RpRegistryConfig } from "@/api/helpers/rp-utils";
import type { OnChainRelyingParty } from "@/api/helpers/temporal-rpc";
import type { KMSClient } from "@aws-sdk/client-kms";
import type { GraphQLClient } from "graphql-request";

// #region Mocks

jest.mock("server-only", () => ({}));

const getEthAddressFromKMSMock = jest.fn();
jest.mock("@/api/helpers/kms-eth", () => ({
  getEthAddressFromKMS: (...args: unknown[]) =>
    getEthAddressFromKMSMock(...args),
}));

const submitTransferManagerTransactionMock = jest.fn();
jest.mock("@/api/helpers/rp-transactions", () => ({
  submitTransferManagerTransaction: (...args: unknown[]) =>
    submitTransferManagerTransactionMock(...args),
}));

const getRpFromContractMock = jest.fn();
jest.mock("@/api/helpers/temporal-rpc", () => ({
  getRpFromContract: (...args: unknown[]) => getRpFromContractMock(...args),
}));

jest.mock("@/lib/logger", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

import { migrateRpManagersToSharedKey } from "../../scripts/migrate-rp-manager-to-shared-key";

const { logger: mockLogger } = jest.requireMock("@/lib/logger") as {
  logger: { info: jest.Mock; error: jest.Mock };
};

// #endregion

// #region Test data

const RP_ID = "rp_1234567890abcdef";
const SECOND_RP_ID = "rp_fedcba0987654321";
const APP_ID = "app_1234567890abcdef1234567890abcdef";
const SECOND_APP_ID = "app_fedcba0987654321fedcba0987654321";
const OLD_KEY_ID = "arn:aws:kms:eu-west-1:111111111111:key/old-key";
const SECOND_OLD_KEY_ID =
  "arn:aws:kms:eu-west-1:111111111111:key/second-old-key";
const SHARED_KEY_ID = "arn:aws:kms:eu-west-1:111111111111:key/shared-key";
const ATTEMPT_ID = "12345678-1234-4234-8234-123456789abc";
const OLD_MANAGER = "0x1111111111111111111111111111111111111111";
const SHARED_MANAGER = "0x2222222222222222222222222222222222222222";
const SIGNER = "0x3333333333333333333333333333333333333333";
const OTHER_ADDRESS = "0x4444444444444444444444444444444444444444";

const makeConfig = (contractAddress: string): RpRegistryConfig => ({
  safeOwnerKmsKeyId: "safe-owner-key",
  contractAddress,
  safeAddress: "0x5555555555555555555555555555555555555555",
  entryPointAddress: "0x6666666666666666666666666666666666666666",
  safe4337ModuleAddress: "0x7777777777777777777777777777777777777777",
  kmsRegion: "eu-west-1",
  domainSeparator: `0x${"88".repeat(32)}`,
  updateRpTypehash: `0x${"99".repeat(32)}`,
  credentialSchemaIssuerRegistryAddress:
    "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
});

const productionConfig = makeConfig(
  "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
);
const stagingConfig = makeConfig("0xcccccccccccccccccccccccccccccccccccccccc");

const registries = [
  { name: "production", config: productionConfig },
  { name: "staging", config: stagingConfig },
];

const deploymentWithStagingMirror = {
  primaryRegistry: registries[0],
  stagingMirrorRegistry: registries[1],
};

const deploymentWithPrimaryOnly = {
  primaryRegistry: registries[0],
};

type CandidateFixture = {
  rp_id: string;
  app_id: string;
  signer_address: string;
  manager_kms_key_id: string;
  staging_status: string | null;
  staging_operation_hash: string | null;
  updated_at: string;
};

const candidate: CandidateFixture = {
  rp_id: RP_ID,
  app_id: APP_ID,
  signer_address: SIGNER,
  manager_kms_key_id: OLD_KEY_ID,
  staging_status: "registered",
  staging_operation_hash: "0xstaging-registration",
  updated_at: "2026-08-04T16:05:10.890615+00:00",
};

const secondCandidate: CandidateFixture = {
  rp_id: SECOND_RP_ID,
  app_id: SECOND_APP_ID,
  signer_address: SIGNER,
  manager_kms_key_id: SECOND_OLD_KEY_ID,
  staging_status: "registered",
  staging_operation_hash: "0xsecond-staging-registration",
  updated_at: "2026-08-04T16:06:10.890615+00:00",
};

const makeOnChainRp = (
  overrides: Partial<OnChainRelyingParty> = {},
): OnChainRelyingParty => ({
  initialized: true,
  active: true,
  manager: OLD_MANAGER,
  signer: SIGNER,
  oprfKeyId: 1n,
  unverifiedWellKnownDomain: "",
  ...overrides,
});

const makeUninitializedRp = (): OnChainRelyingParty =>
  makeOnChainRp({
    initialized: false,
    active: false,
    manager: "0x0000000000000000000000000000000000000000",
    signer: "0x0000000000000000000000000000000000000000",
  });

const kmsClient = {} as KMSClient;
const graphqlRequestMock = jest.fn();
const graphqlClient = {
  request: graphqlRequestMock,
} as unknown as GraphQLClient;

function arrangeGraphql(
  candidates: CandidateFixture[] = [candidate],
  affectedRows = 1,
): void {
  graphqlRequestMock
    .mockResolvedValueOnce({ rp_registration: candidates })
    .mockResolvedValue({
      update_rp_registration: { affected_rows: affectedRows },
    });
}

function arrangeRegistryQueues(
  statesByContract: Record<string, OnChainRelyingParty[]>,
): void {
  getRpFromContractMock.mockImplementation(
    async (_rpId: bigint, contractAddress: string) => {
      const states = statesByContract[contractAddress];
      const next = states?.shift();
      if (!next) {
        throw new Error(`No arranged state for ${contractAddress}`);
      }
      return next;
    },
  );
}

beforeEach(() => {
  jest.clearAllMocks();

  getEthAddressFromKMSMock.mockImplementation(
    async (_client: KMSClient, keyId: string) =>
      keyId === SHARED_KEY_ID ? SHARED_MANAGER : OLD_MANAGER,
  );
  submitTransferManagerTransactionMock.mockImplementation(
    async (config: RpRegistryConfig) =>
      config.contractAddress === productionConfig.contractAddress
        ? "0xproduction-operation"
        : "0xstaging-operation",
  );
});

// #endregion

// #region Successful and resumable migrations

describe("migrateRpManagersToSharedKey [successful migrations]", () => {
  it("transfers both registries, confirms them, and then updates the database", async () => {
    arrangeGraphql();
    arrangeRegistryQueues({
      [productionConfig.contractAddress]: [
        makeOnChainRp(),
        makeOnChainRp({ manager: SHARED_MANAGER }),
        makeOnChainRp({ manager: SHARED_MANAGER }),
      ],
      [stagingConfig.contractAddress]: [
        makeOnChainRp(),
        makeOnChainRp({ manager: SHARED_MANAGER }),
        makeOnChainRp({ manager: SHARED_MANAGER }),
      ],
    });

    const report = await migrateRpManagersToSharedKey({
      graphqlClient,
      kmsClient,
      sharedManagerKeyId: SHARED_KEY_ID,
      ...deploymentWithStagingMirror,
      attemptId: ATTEMPT_ID,
      pollIntervalMs: 0,
    });

    expect(submitTransferManagerTransactionMock).toHaveBeenCalledTimes(2);
    expect(submitTransferManagerTransactionMock).toHaveBeenNthCalledWith(
      1,
      productionConfig,
      expect.objectContaining({
        rpId: BigInt("0x1234567890abcdef"),
        newManagerAddress: SHARED_MANAGER,
        managerKmsKeyId: OLD_KEY_ID,
        kmsClient,
      }),
    );
    expect(graphqlRequestMock).toHaveBeenCalledTimes(3);
    expect(graphqlRequestMock.mock.calls[1][1]).toEqual({
      rp_id: RP_ID,
      app_id: APP_ID,
      old_manager_kms_key_id: OLD_KEY_ID,
      old_manager_kms_key_arn: OLD_KEY_ID,
      shared_manager_kms_key_id: SHARED_KEY_ID,
    });
    expect(graphqlRequestMock.mock.calls[2][1]).toEqual({
      rp_id: RP_ID,
      old_manager_key_id: OLD_KEY_ID,
      shared_manager_key_id: SHARED_KEY_ID,
    });
    expect(report.results).toEqual([
      expect.objectContaining({
        rpId: RP_ID,
        status: "migrated",
        eligibleForCleanup: true,
        operationHashes: {
          production: "0xproduction-operation",
          staging: "0xstaging-operation",
        },
      }),
    ]);
    expect(mockLogger.info).toHaveBeenCalledWith(
      "RP manager key migration completed",
      expect.objectContaining({
        attempt_id: ATTEMPT_ID,
        rp_id: RP_ID,
        app_id: APP_ID,
        migrated_registries: ["production", "staging"],
        skipped_registries: [],
      }),
    );
  });

  it("finalizes the database without sending transactions when both registries already use the shared manager", async () => {
    arrangeGraphql();
    arrangeRegistryQueues({
      [productionConfig.contractAddress]: [
        makeOnChainRp({ manager: SHARED_MANAGER }),
        makeOnChainRp({ manager: SHARED_MANAGER }),
      ],
      [stagingConfig.contractAddress]: [
        makeOnChainRp({ manager: SHARED_MANAGER }),
        makeOnChainRp({ manager: SHARED_MANAGER }),
      ],
    });

    const report = await migrateRpManagersToSharedKey({
      graphqlClient,
      kmsClient,
      sharedManagerKeyId: SHARED_KEY_ID,
      ...deploymentWithStagingMirror,
    });

    expect(submitTransferManagerTransactionMock).not.toHaveBeenCalled();
    expect(report.results[0]).toEqual(
      expect.objectContaining({
        status: "already_migrated",
        eligibleForCleanup: true,
        operationHashes: {},
      }),
    );
  });

  it("resumes a partial migration and transfers only the remaining registry", async () => {
    arrangeGraphql();
    arrangeRegistryQueues({
      [productionConfig.contractAddress]: [
        makeOnChainRp({ manager: SHARED_MANAGER }),
        makeOnChainRp({ manager: SHARED_MANAGER }),
      ],
      [stagingConfig.contractAddress]: [
        makeOnChainRp(),
        makeOnChainRp({ manager: SHARED_MANAGER }),
        makeOnChainRp({ manager: SHARED_MANAGER }),
      ],
    });

    const report = await migrateRpManagersToSharedKey({
      graphqlClient,
      kmsClient,
      sharedManagerKeyId: SHARED_KEY_ID,
      ...deploymentWithStagingMirror,
      pollIntervalMs: 0,
    });

    expect(submitTransferManagerTransactionMock).toHaveBeenCalledTimes(1);
    expect(submitTransferManagerTransactionMock).toHaveBeenCalledWith(
      stagingConfig,
      expect.any(Object),
    );
    expect(report.results[0]).toEqual(
      expect.objectContaining({ status: "migrated" }),
    );
  });
});

// #endregion

// #region Registry configuration and staging mirror behavior

describe("migrateRpManagersToSharedKey [registry configurations]", () => {
  it("migrates only the primary registry when no mirror is configured", async () => {
    arrangeGraphql([{ ...candidate, staging_status: null }]);
    arrangeRegistryQueues({
      [productionConfig.contractAddress]: [
        makeOnChainRp(),
        makeOnChainRp({ manager: SHARED_MANAGER }),
        makeOnChainRp({ manager: SHARED_MANAGER }),
      ],
    });

    const report = await migrateRpManagersToSharedKey({
      graphqlClient,
      kmsClient,
      sharedManagerKeyId: SHARED_KEY_ID,
      ...deploymentWithPrimaryOnly,
      pollIntervalMs: 0,
    });

    expect(getRpFromContractMock).not.toHaveBeenCalledWith(
      expect.anything(),
      stagingConfig.contractAddress,
    );
    expect(submitTransferManagerTransactionMock).toHaveBeenCalledTimes(1);
    expect(report.results[0]).toEqual(
      expect.objectContaining({
        status: "migrated",
        skippedRegistries: [],
      }),
    );
  });

  it("skips an absent staging mirror for a historical production RP", async () => {
    arrangeGraphql([
      {
        ...candidate,
        staging_status: null,
        staging_operation_hash: null,
      },
    ]);
    arrangeRegistryQueues({
      [productionConfig.contractAddress]: [
        makeOnChainRp(),
        makeOnChainRp({ manager: SHARED_MANAGER }),
        makeOnChainRp({ manager: SHARED_MANAGER }),
      ],
      [stagingConfig.contractAddress]: [
        makeUninitializedRp(),
        makeUninitializedRp(),
      ],
    });

    const report = await migrateRpManagersToSharedKey({
      graphqlClient,
      kmsClient,
      sharedManagerKeyId: SHARED_KEY_ID,
      ...deploymentWithStagingMirror,
      pollIntervalMs: 0,
    });

    expect(submitTransferManagerTransactionMock).toHaveBeenCalledTimes(1);
    expect(submitTransferManagerTransactionMock).toHaveBeenCalledWith(
      productionConfig,
      expect.any(Object),
    );
    expect(report.results[0]).toEqual(
      expect.objectContaining({
        status: "migrated",
        skippedRegistries: ["staging"],
      }),
    );
  });

  it("migrates an initialized staging mirror even when its DB status is null", async () => {
    arrangeGraphql([{ ...candidate, staging_status: null }]);
    arrangeRegistryQueues({
      [productionConfig.contractAddress]: [
        makeOnChainRp(),
        makeOnChainRp({ manager: SHARED_MANAGER }),
        makeOnChainRp({ manager: SHARED_MANAGER }),
      ],
      [stagingConfig.contractAddress]: [
        makeOnChainRp(),
        makeOnChainRp({ manager: SHARED_MANAGER }),
        makeOnChainRp({ manager: SHARED_MANAGER }),
      ],
    });

    const report = await migrateRpManagersToSharedKey({
      graphqlClient,
      kmsClient,
      sharedManagerKeyId: SHARED_KEY_ID,
      ...deploymentWithStagingMirror,
      pollIntervalMs: 0,
    });

    expect(submitTransferManagerTransactionMock).toHaveBeenCalledTimes(2);
    expect(report.results[0]).toEqual(
      expect.objectContaining({
        status: "migrated",
        skippedRegistries: [],
      }),
    );
  });

  it("rejects an absent staging mirror when the database says it has state", async () => {
    arrangeGraphql();
    arrangeRegistryQueues({
      [productionConfig.contractAddress]: [makeOnChainRp()],
      [stagingConfig.contractAddress]: [makeUninitializedRp()],
    });

    const report = await migrateRpManagersToSharedKey({
      graphqlClient,
      kmsClient,
      sharedManagerKeyId: SHARED_KEY_ID,
      ...deploymentWithStagingMirror,
    });

    expect(submitTransferManagerTransactionMock).not.toHaveBeenCalled();
    expect(graphqlRequestMock).toHaveBeenCalledTimes(2);
    expect(report.results[0]).toEqual(
      expect.objectContaining({
        status: "failed",
        failure: expect.objectContaining({ stage: "conflict" }),
      }),
    );
  });

  it("rejects an initialized staging mirror with an unsettled DB status", async () => {
    arrangeGraphql([{ ...candidate, staging_status: "pending" }]);
    arrangeRegistryQueues({
      [productionConfig.contractAddress]: [makeOnChainRp()],
      [stagingConfig.contractAddress]: [makeOnChainRp()],
    });

    const report = await migrateRpManagersToSharedKey({
      graphqlClient,
      kmsClient,
      sharedManagerKeyId: SHARED_KEY_ID,
      ...deploymentWithStagingMirror,
    });

    expect(submitTransferManagerTransactionMock).not.toHaveBeenCalled();
    expect(report.results[0]).toEqual(
      expect.objectContaining({
        status: "failed",
        failure: expect.objectContaining({ stage: "conflict" }),
      }),
    );
  });

  it("does not migrate the primary registry when the staging mirror cannot be read", async () => {
    arrangeGraphql();
    getRpFromContractMock.mockImplementation(
      async (_rpId: bigint, contractAddress: string) => {
        if (contractAddress === productionConfig.contractAddress) {
          return makeOnChainRp();
        }
        throw new Error("staging RPC unavailable");
      },
    );

    const report = await migrateRpManagersToSharedKey({
      graphqlClient,
      kmsClient,
      sharedManagerKeyId: SHARED_KEY_ID,
      ...deploymentWithStagingMirror,
    });

    expect(submitTransferManagerTransactionMock).not.toHaveBeenCalled();
    expect(graphqlRequestMock).toHaveBeenCalledTimes(2);
    expect(report.results[0]).toEqual(
      expect.objectContaining({
        status: "failed",
        failure: expect.objectContaining({ stage: "read_registry" }),
      }),
    );
  });

  it("does not update the registration if an initially absent mirror appears during migration", async () => {
    arrangeGraphql([{ ...candidate, staging_status: null }]);
    arrangeRegistryQueues({
      [productionConfig.contractAddress]: [
        makeOnChainRp({ manager: SHARED_MANAGER }),
        makeOnChainRp({ manager: SHARED_MANAGER }),
      ],
      [stagingConfig.contractAddress]: [makeUninitializedRp(), makeOnChainRp()],
    });

    const report = await migrateRpManagersToSharedKey({
      graphqlClient,
      kmsClient,
      sharedManagerKeyId: SHARED_KEY_ID,
      ...deploymentWithStagingMirror,
    });

    expect(graphqlRequestMock).toHaveBeenCalledTimes(2);
    expect(report.results[0]).toEqual(
      expect.objectContaining({
        status: "failed",
        failure: expect.objectContaining({ stage: "verify_final_state" }),
      }),
    );
  });
});

// #endregion

// #region Failure isolation and safety guards

describe("migrateRpManagersToSharedKey [safety guards]", () => {
  it("does not start migration when the audit record cannot be written", async () => {
    graphqlRequestMock
      .mockResolvedValueOnce({ rp_registration: [candidate] })
      .mockRejectedValueOnce(new Error("audit database unavailable"));

    const report = await migrateRpManagersToSharedKey({
      graphqlClient,
      kmsClient,
      sharedManagerKeyId: SHARED_KEY_ID,
      ...deploymentWithPrimaryOnly,
    });

    expect(getEthAddressFromKMSMock).toHaveBeenCalledTimes(1);
    expect(getRpFromContractMock).not.toHaveBeenCalled();
    expect(submitTransferManagerTransactionMock).not.toHaveBeenCalled();
    expect(report.results[0]).toEqual(
      expect.objectContaining({
        status: "failed",
        failure: {
          stage: "write_audit",
          detail: "audit database unavailable",
        },
      }),
    );
  });

  it("does not submit or update the registration when a registry has an unexpected manager", async () => {
    arrangeGraphql();
    arrangeRegistryQueues({
      [productionConfig.contractAddress]: [
        makeOnChainRp({ manager: OTHER_ADDRESS }),
      ],
    });

    const report = await migrateRpManagersToSharedKey({
      graphqlClient,
      kmsClient,
      sharedManagerKeyId: SHARED_KEY_ID,
      ...deploymentWithStagingMirror,
    });

    expect(submitTransferManagerTransactionMock).not.toHaveBeenCalled();
    expect(graphqlRequestMock).toHaveBeenCalledTimes(2);
    expect(report.results[0]).toEqual(
      expect.objectContaining({
        status: "failed",
        eligibleForCleanup: false,
        failure: expect.objectContaining({ stage: "conflict" }),
      }),
    );
  });

  it("does not update the registration when transaction submission fails", async () => {
    arrangeGraphql();
    arrangeRegistryQueues({
      [productionConfig.contractAddress]: [makeOnChainRp()],
      [stagingConfig.contractAddress]: [makeOnChainRp()],
    });
    submitTransferManagerTransactionMock.mockRejectedValueOnce(
      new Error("bundler unavailable"),
    );

    const report = await migrateRpManagersToSharedKey({
      graphqlClient,
      kmsClient,
      sharedManagerKeyId: SHARED_KEY_ID,
      ...deploymentWithStagingMirror,
    });

    expect(graphqlRequestMock).toHaveBeenCalledTimes(2);
    expect(report.results[0]).toEqual(
      expect.objectContaining({
        status: "failed",
        failure: expect.objectContaining({ stage: "submit_transfer" }),
      }),
    );
  });

  it("keeps the registration unchanged when the second registry fails after the first one succeeds", async () => {
    arrangeGraphql();
    arrangeRegistryQueues({
      [productionConfig.contractAddress]: [
        makeOnChainRp(),
        makeOnChainRp({ manager: SHARED_MANAGER }),
      ],
      [stagingConfig.contractAddress]: [makeOnChainRp()],
    });
    submitTransferManagerTransactionMock
      .mockResolvedValueOnce("0xproduction-operation")
      .mockRejectedValueOnce(new Error("staging bundler unavailable"));

    const report = await migrateRpManagersToSharedKey({
      graphqlClient,
      kmsClient,
      sharedManagerKeyId: SHARED_KEY_ID,
      ...deploymentWithStagingMirror,
      pollIntervalMs: 0,
    });

    expect(submitTransferManagerTransactionMock).toHaveBeenCalledTimes(2);
    expect(graphqlRequestMock).toHaveBeenCalledTimes(2);
    expect(report.results[0]).toEqual(
      expect.objectContaining({
        status: "failed",
        eligibleForCleanup: false,
        operationHashes: { production: "0xproduction-operation" },
        failure: expect.objectContaining({ stage: "submit_transfer" }),
      }),
    );
  });

  it("does not update the registration when on-chain confirmation times out", async () => {
    arrangeGraphql();
    arrangeRegistryQueues({
      [productionConfig.contractAddress]: [makeOnChainRp(), makeOnChainRp()],
    });

    const report = await migrateRpManagersToSharedKey({
      graphqlClient,
      kmsClient,
      sharedManagerKeyId: SHARED_KEY_ID,
      ...deploymentWithPrimaryOnly,
      confirmationTimeoutMs: 0,
    });

    expect(graphqlRequestMock).toHaveBeenCalledTimes(2);
    expect(report.results[0]).toEqual(
      expect.objectContaining({
        status: "failed",
        operationHashes: { production: "0xproduction-operation" },
        failure: expect.objectContaining({
          stage: "wait_for_confirmation",
        }),
      }),
    );
  });

  it("does not update the registration when final verification detects a signer change", async () => {
    arrangeGraphql();
    arrangeRegistryQueues({
      [productionConfig.contractAddress]: [
        makeOnChainRp(),
        makeOnChainRp({ manager: SHARED_MANAGER }),
        makeOnChainRp({ manager: SHARED_MANAGER, signer: OTHER_ADDRESS }),
      ],
    });

    const report = await migrateRpManagersToSharedKey({
      graphqlClient,
      kmsClient,
      sharedManagerKeyId: SHARED_KEY_ID,
      ...deploymentWithPrimaryOnly,
      pollIntervalMs: 0,
    });

    expect(graphqlRequestMock).toHaveBeenCalledTimes(2);
    expect(report.results[0]).toEqual(
      expect.objectContaining({
        status: "failed",
        failure: expect.objectContaining({ stage: "verify_final_state" }),
      }),
    );
  });

  it("reports a concurrent database change when the conditional update affects no rows", async () => {
    arrangeGraphql([candidate], 0);
    arrangeRegistryQueues({
      [productionConfig.contractAddress]: [
        makeOnChainRp({ manager: SHARED_MANAGER }),
        makeOnChainRp({ manager: SHARED_MANAGER }),
      ],
    });

    const report = await migrateRpManagersToSharedKey({
      graphqlClient,
      kmsClient,
      sharedManagerKeyId: SHARED_KEY_ID,
      ...deploymentWithPrimaryOnly,
    });

    expect(report.results[0]).toEqual(
      expect.objectContaining({
        status: "failed",
        eligibleForCleanup: false,
        failure: expect.objectContaining({ stage: "update_database" }),
      }),
    );
  });

  it("finalizes the database when the row is no longer registered after on-chain transfer", async () => {
    const pendingCandidate = {
      ...candidate,
      status: "pending",
      updated_at: "2026-08-06T12:00:00.000Z",
    };
    arrangeGraphql([pendingCandidate]);
    arrangeRegistryQueues({
      [productionConfig.contractAddress]: [
        makeOnChainRp({ manager: SHARED_MANAGER }),
        makeOnChainRp({ manager: SHARED_MANAGER }),
      ],
    });

    const report = await migrateRpManagersToSharedKey({
      graphqlClient,
      kmsClient,
      sharedManagerKeyId: SHARED_KEY_ID,
      ...deploymentWithPrimaryOnly,
      pollIntervalMs: 0,
    });

    expect(graphqlRequestMock.mock.calls[2][1]).toEqual({
      rp_id: RP_ID,
      old_manager_key_id: OLD_KEY_ID,
      shared_manager_key_id: SHARED_KEY_ID,
    });
    expect(report.results[0]).toEqual(
      expect.objectContaining({
        status: "already_migrated",
      }),
    );
  });

  it("continues with later RPs after an earlier RP fails", async () => {
    arrangeGraphql([candidate, secondCandidate]);
    getEthAddressFromKMSMock.mockImplementation(
      async (_client: KMSClient, keyId: string) => {
        if (keyId === SHARED_KEY_ID) return SHARED_MANAGER;
        if (keyId === OLD_KEY_ID) throw new Error("old key unavailable");
        return OLD_MANAGER;
      },
    );
    arrangeRegistryQueues({
      [productionConfig.contractAddress]: [
        makeOnChainRp(),
        makeOnChainRp({ manager: SHARED_MANAGER }),
        makeOnChainRp({ manager: SHARED_MANAGER }),
      ],
    });

    const report = await migrateRpManagersToSharedKey({
      graphqlClient,
      kmsClient,
      sharedManagerKeyId: SHARED_KEY_ID,
      ...deploymentWithPrimaryOnly,
      pollIntervalMs: 0,
    });

    expect(report.results).toEqual([
      expect.objectContaining({
        rpId: RP_ID,
        status: "failed",
        failure: expect.objectContaining({ stage: "load_old_key" }),
      }),
      expect.objectContaining({
        rpId: SECOND_RP_ID,
        status: "migrated",
      }),
    ]);
  });

  it("isolates an invalid RP ID returned by the database", async () => {
    arrangeGraphql([{ ...candidate, rp_id: "invalid" }, secondCandidate]);
    arrangeRegistryQueues({
      [productionConfig.contractAddress]: [
        makeOnChainRp(),
        makeOnChainRp({ manager: SHARED_MANAGER }),
        makeOnChainRp({ manager: SHARED_MANAGER }),
      ],
    });

    const report = await migrateRpManagersToSharedKey({
      graphqlClient,
      kmsClient,
      sharedManagerKeyId: SHARED_KEY_ID,
      ...deploymentWithPrimaryOnly,
      pollIntervalMs: 0,
    });

    expect(report.results).toEqual([
      expect.objectContaining({
        rpId: "invalid",
        status: "failed",
        failure: expect.objectContaining({ stage: "conflict" }),
      }),
      expect.objectContaining({
        rpId: SECOND_RP_ID,
        status: "migrated",
      }),
    ]);
  });

  it("never marks the shared key itself as eligible for cleanup", async () => {
    arrangeGraphql([{ ...candidate, manager_kms_key_id: SHARED_KEY_ID }]);
    arrangeRegistryQueues({
      [productionConfig.contractAddress]: [
        makeOnChainRp({ manager: SHARED_MANAGER }),
        makeOnChainRp({ manager: SHARED_MANAGER }),
      ],
    });

    const report = await migrateRpManagersToSharedKey({
      graphqlClient,
      kmsClient,
      sharedManagerKeyId: SHARED_KEY_ID,
      ...deploymentWithPrimaryOnly,
    });

    expect(report.results[0]).toEqual(
      expect.objectContaining({
        status: "already_migrated",
        eligibleForCleanup: false,
      }),
    );
  });
});

// #endregion

// #region Input and candidate selection

describe("migrateRpManagersToSharedKey [input]", () => {
  it("does no on-chain work when the requested RP list is empty", async () => {
    const report = await migrateRpManagersToSharedKey({
      graphqlClient,
      kmsClient,
      sharedManagerKeyId: SHARED_KEY_ID,
      ...deploymentWithStagingMirror,
      rpIds: [],
    });

    expect(graphqlRequestMock).not.toHaveBeenCalled();
    expect(getRpFromContractMock).not.toHaveBeenCalled();
    expect(report.candidateCount).toBe(0);
    expect(report.results).toEqual([]);
  });

  it("passes a deduplicated RP ID scope to the candidate query", async () => {
    arrangeGraphql([]);

    await migrateRpManagersToSharedKey({
      graphqlClient,
      kmsClient,
      sharedManagerKeyId: SHARED_KEY_ID,
      ...deploymentWithStagingMirror,
      rpIds: [RP_ID, RP_ID, SECOND_RP_ID],
    });

    expect(graphqlRequestMock).toHaveBeenCalledWith(expect.anything(), {
      rp_ids: [RP_ID, SECOND_RP_ID],
    });
  });

  it("rejects invalid RP IDs before making external calls", async () => {
    await expect(
      migrateRpManagersToSharedKey({
        graphqlClient,
        kmsClient,
        sharedManagerKeyId: SHARED_KEY_ID,
        ...deploymentWithStagingMirror,
        rpIds: ["not-an-rp-id"],
      }),
    ).rejects.toThrow("Invalid RP ID");

    expect(getEthAddressFromKMSMock).not.toHaveBeenCalled();
    expect(graphqlRequestMock).not.toHaveBeenCalled();
  });

  it("accepts a primary registry without a staging mirror", async () => {
    arrangeGraphql([]);

    const report = await migrateRpManagersToSharedKey({
      graphqlClient,
      kmsClient,
      sharedManagerKeyId: SHARED_KEY_ID,
      primaryRegistry: registries[0],
    });

    expect(report.candidateCount).toBe(0);
  });

  it("rejects registry configurations that point to the same contract", async () => {
    await expect(
      migrateRpManagersToSharedKey({
        graphqlClient,
        kmsClient,
        sharedManagerKeyId: SHARED_KEY_ID,
        primaryRegistry: registries[0],
        stagingMirrorRegistry: {
          name: "staging",
          config: productionConfig,
        },
      }),
    ).rejects.toThrow(
      "Primary and staging mirror registries must use different contracts",
    );

    expect(getEthAddressFromKMSMock).not.toHaveBeenCalled();
    expect(graphqlRequestMock).not.toHaveBeenCalled();
  });
});

// #endregion
