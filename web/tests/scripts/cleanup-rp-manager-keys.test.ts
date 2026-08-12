import type { RpRegistryConfig } from "@/api/helpers/rp-utils";
import {
  DescribeKeyCommand,
  ListResourceTagsCommand,
  ScheduleKeyDeletionCommand,
  type KMSClient,
} from "@aws-sdk/client-kms";
import type { DocumentNode } from "graphql";
import type { GraphQLClient } from "graphql-request";

// #region Mocks

jest.mock("server-only", () => ({}));

const getEthAddressFromKMSMock = jest.fn();
jest.mock("@/api/helpers/kms-eth", () => ({
  getEthAddressFromKMS: (...args: unknown[]) =>
    getEthAddressFromKMSMock(...args),
}));

const getRpFromContractMock = jest.fn();
jest.mock("@/api/helpers/temporal-rpc", () => ({
  getRpFromContract: (...args: unknown[]) => getRpFromContractMock(...args),
}));

jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import {
  CleanupStatus,
  cleanupRpManagerKeys,
} from "../../scripts/cleanup-rp-manager-keys";

// #endregion

// #region Test data

const RP_ID = "rp_1234567890abcdef";
const APP_ID = "app_1234567890abcdef1234567890abcdef";
const OLD_KEY_ID = "old-key-id";
const OLD_KEY_ARN = "arn:aws:kms:eu-west-1:111111111111:key/old-key";
const SHARED_KEY_ARN = "arn:aws:kms:eu-west-1:111111111111:key/shared-key";
const SAFE_OWNER_KEY_ARN =
  "arn:aws:kms:eu-west-1:111111111111:key/safe-owner-key";
const STAGING_SAFE_OWNER_KEY_ARN =
  "arn:aws:kms:eu-west-1:111111111111:key/staging-safe-owner-key";
const OLD_MANAGER = "0x1111111111111111111111111111111111111111";
const SHARED_MANAGER = "0x2222222222222222222222222222222222222222";
const CUSTOMER_MANAGER = "0x4444444444444444444444444444444444444444";
const DELETION_DATE = new Date("2026-09-11T12:00:00.000Z");

const makeConfig = (contractAddress: string): RpRegistryConfig => ({
  safeOwnerKmsKeyId: SAFE_OWNER_KEY_ARN,
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

const primaryConfig = makeConfig("0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");
const stagingConfig = {
  ...makeConfig("0xcccccccccccccccccccccccccccccccccccccccc"),
  safeOwnerKmsKeyId: STAGING_SAFE_OWNER_KEY_ARN,
};

const candidate = {
  rp_id: RP_ID,
  app_id: APP_ID,
  old_manager_kms_key_id: OLD_KEY_ID,
  old_manager_kms_key_arn: OLD_KEY_ARN,
  shared_manager_kms_key_id: SHARED_KEY_ARN,
  cleanup_status: CleanupStatus.Pending,
};

let candidates = [candidate];
let databaseState: {
  rp_registration: Array<{
    manager_kms_key_id: string | null;
    is_unique_manager_key: boolean;
    staging_status: string | null;
  }>;
  old_key_references: Array<{ rp_id: string }>;
  duplicate_audits: Array<{ rp_id: string }>;
} = {
  rp_registration: [
    {
      manager_kms_key_id: SHARED_KEY_ARN,
      is_unique_manager_key: false,
      staging_status: null,
    },
  ],
  old_key_references: [],
  duplicate_audits: [{ rp_id: RP_ID }],
};
let recordedOutcomes: Array<Record<string, unknown>> = [];

const graphqlRequestMock = jest.fn();
const graphqlClient = {
  request: graphqlRequestMock,
} as unknown as GraphQLClient;

const kmsSendMock = jest.fn();
const kmsClient = { send: kmsSendMock } as unknown as KMSClient;

function operationName(document: string | DocumentNode): string | undefined {
  if (typeof document === "string") {
    return document.match(/(?:query|mutation)\s+(\w+)/)?.[1];
  }

  const operation = document.definitions.find(
    (definition) => definition.kind === "OperationDefinition",
  );
  return operation?.kind === "OperationDefinition"
    ? operation.name?.value
    : undefined;
}

function arrangeGraphql(): void {
  graphqlRequestMock.mockImplementation(
    async (document: string | DocumentNode, variables?: unknown) => {
      switch (operationName(document)) {
        case "GetRpManagerKeyCleanupCandidates":
        case "GetRpManagerKeyCleanupCandidatesById":
          return { rp_manager_key_migration_audit: candidates };
        case "GetRpManagerKeyCleanupDatabaseState":
          return databaseState;
        case "RecordRpManagerKeyCleanupOutcome":
          recordedOutcomes.push(variables as Record<string, unknown>);
          return {
            update_rp_manager_key_migration_audit_by_pk: { rp_id: RP_ID },
          };
        default:
          throw new Error(`Unexpected operation: ${operationName(document)}`);
      }
    },
  );
}

function kmsMetadata(
  keyId: string,
  overrides: Record<string, unknown> = {},
): { KeyMetadata: Record<string, unknown> } {
  return {
    KeyMetadata: {
      Arn: keyId,
      AWSAccountId: "111111111111",
      KeySpec: "ECC_SECG_P256K1",
      KeyUsage: "SIGN_VERIFY",
      KeyState: "Enabled",
      ...overrides,
    },
  };
}

function arrangeCurrentAccountKms(
  oldKeyOverrides: Record<string, unknown> = {},
  tags: Array<{ TagKey: string; TagValue: string }> = [
    { TagKey: "app", TagValue: "developer-portal" },
    { TagKey: "rpId", TagValue: RP_ID },
  ],
): void {
  kmsSendMock.mockImplementation(async (command: unknown) => {
    if (command instanceof DescribeKeyCommand) {
      const keyId = command.input.KeyId ?? "";
      if (keyId === OLD_KEY_ARN) {
        return kmsMetadata(OLD_KEY_ARN, oldKeyOverrides);
      }
      return kmsMetadata(keyId);
    }

    if (command instanceof ListResourceTagsCommand) {
      return { Tags: tags };
    }

    if (command instanceof ScheduleKeyDeletionCommand) {
      return { DeletionDate: DELETION_DATE };
    }

    throw new Error(`Unexpected KMS command: ${String(command)}`);
  });
}

const primaryOnly = {
  graphqlClient,
  kmsClient,
  primaryRegistry: { name: "primary", config: primaryConfig },
};

const withStagingMirror = {
  ...primaryOnly,
  stagingMirrorRegistry: { name: "staging", config: stagingConfig },
};

beforeEach(() => {
  jest.clearAllMocks();
  candidates = [candidate];
  databaseState = {
    rp_registration: [
      {
        manager_kms_key_id: SHARED_KEY_ARN,
        is_unique_manager_key: false,
        staging_status: null,
      },
    ],
    old_key_references: [],
    duplicate_audits: [{ rp_id: RP_ID }],
  };
  recordedOutcomes = [];

  arrangeGraphql();
  arrangeCurrentAccountKms();
  getEthAddressFromKMSMock.mockImplementation(
    async (_client: unknown, keyId: string) =>
      keyId === SHARED_KEY_ARN ? SHARED_MANAGER : OLD_MANAGER,
  );
  getRpFromContractMock.mockResolvedValue({
    initialized: true,
    manager: SHARED_MANAGER,
  });
});

// #endregion

// #region Pipeline outcomes

describe("cleanupRpManagerKeys [pipeline]", () => {
  it("validates and schedules a current-account key with a 30-day window", async () => {
    const report = await cleanupRpManagerKeys(primaryOnly);

    expect(kmsSendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        input: {
          KeyId: OLD_KEY_ARN,
          PendingWindowInDays: 30,
        },
      }),
    );
    expect(report.results).toEqual([
      {
        rpId: RP_ID,
        appId: APP_ID,
        oldManagerKeyArn: OLD_KEY_ARN,
        status: CleanupStatus.DeletionScheduled,
        expectedDeletionAt: DELETION_DATE.toISOString(),
      },
    ]);
  });

  it("hands a key from another AWS account to external cleanup", async () => {
    arrangeCurrentAccountKms({ AWSAccountId: "222222222222" });

    const report = await cleanupRpManagerKeys(primaryOnly);

    expect(kmsSendMock).not.toHaveBeenCalledWith(
      expect.any(ScheduleKeyDeletionCommand),
    );
    expect(report.results[0]?.status).toBe(
      CleanupStatus.ReadyForExternalCleanup,
    );
  });

  it("skips without writing status while the old key is still referenced", async () => {
    databaseState.old_key_references = [{ rp_id: RP_ID }];

    const report = await cleanupRpManagerKeys(primaryOnly);

    expect(getRpFromContractMock).not.toHaveBeenCalled();
    expect(kmsSendMock).not.toHaveBeenCalled();
    expect(recordedOutcomes).toEqual([]);
    expect(report.results[0]).toEqual(
      expect.objectContaining({
        status: "skipped",
        detail: "The old manager key is still referenced by an RP registration",
      }),
    );
  });

  it("schedules deletion when the RP registration row is gone", async () => {
    databaseState.rp_registration = [];

    const report = await cleanupRpManagerKeys(primaryOnly);

    expect(report.results[0]?.status).toBe(CleanupStatus.DeletionScheduled);
    expect(kmsSendMock).toHaveBeenCalledWith(
      expect.any(ScheduleKeyDeletionCommand),
    );
  });

  it("schedules deletion after a self-managed transfer away from the old key", async () => {
    databaseState.rp_registration = [
      {
        manager_kms_key_id: null,
        is_unique_manager_key: false,
        staging_status: null,
      },
    ];
    getRpFromContractMock.mockResolvedValue({
      initialized: true,
      manager: CUSTOMER_MANAGER,
    });

    const report = await cleanupRpManagerKeys(primaryOnly);

    expect(report.results[0]?.status).toBe(CleanupStatus.DeletionScheduled);
  });

  it("schedules deletion when the staging mirror was never registered", async () => {
    getRpFromContractMock.mockImplementation(
      async (_rpId: bigint, contractAddress: string) => {
        if (contractAddress === stagingConfig.contractAddress) {
          return {
            initialized: false,
            manager: "0x0000000000000000000000000000000000000000",
          };
        }
        return { initialized: true, manager: SHARED_MANAGER };
      },
    );

    const report = await cleanupRpManagerKeys(withStagingMirror);

    expect(report.results[0]?.status).toBe(CleanupStatus.DeletionScheduled);
  });

  it("blocks when the staging mirror is missing but the database has a staging status", async () => {
    databaseState.rp_registration[0]!.staging_status = "registered";
    getRpFromContractMock.mockImplementation(
      async (_rpId: bigint, contractAddress: string) => {
        if (contractAddress === stagingConfig.contractAddress) {
          return {
            initialized: false,
            manager: "0x0000000000000000000000000000000000000000",
          };
        }
        return { initialized: true, manager: SHARED_MANAGER };
      },
    );

    const report = await cleanupRpManagerKeys(withStagingMirror);

    expect(kmsSendMock).not.toHaveBeenCalledWith(
      expect.any(ScheduleKeyDeletionCommand),
    );
    expect(report.results[0]).toEqual(
      expect.objectContaining({
        status: CleanupStatus.Blocked,
        detail: "RP is not initialized in registry staging",
      }),
    );
  });

  it("blocks when the old key tags do not match this RP", async () => {
    arrangeCurrentAccountKms({}, [
      { TagKey: "app", TagValue: "developer-portal" },
      { TagKey: "rpId", TagValue: "rp_fedcba0987654321" },
    ]);

    const report = await cleanupRpManagerKeys(primaryOnly);

    expect(kmsSendMock).not.toHaveBeenCalledWith(
      expect.any(ScheduleKeyDeletionCommand),
    );
    expect(report.results[0]?.status).toBe(CleanupStatus.Blocked);
  });

  it("blocks when the old key is the shared manager key", async () => {
    candidates = [{ ...candidate, old_manager_kms_key_arn: SHARED_KEY_ARN }];
    kmsSendMock.mockImplementation(async (command: unknown) => {
      if (command instanceof DescribeKeyCommand) {
        return kmsMetadata(command.input.KeyId ?? "");
      }
      throw new Error("No destructive command expected for a protected key");
    });

    const report = await cleanupRpManagerKeys(primaryOnly);

    expect(report.results[0]).toEqual(
      expect.objectContaining({
        status: CleanupStatus.Blocked,
        detail: "The old manager key is a protected shared or Safe owner key",
      }),
    );
  });

  it("blocks when the old key is not an ECC signing key", async () => {
    arrangeCurrentAccountKms({
      KeySpec: "RSA_2048",
      KeyUsage: "ENCRYPT_DECRYPT",
    });

    const report = await cleanupRpManagerKeys(primaryOnly);

    expect(kmsSendMock).not.toHaveBeenCalledWith(
      expect.any(ScheduleKeyDeletionCommand),
    );
    expect(report.results[0]?.status).toBe(CleanupStatus.Blocked);
  });

  it("recovers when KMS already has the key in PendingDeletion", async () => {
    arrangeCurrentAccountKms({
      KeyState: "PendingDeletion",
      DeletionDate: DELETION_DATE,
    });

    const report = await cleanupRpManagerKeys(primaryOnly);

    expect(
      kmsSendMock.mock.calls.some(
        ([command]) => command instanceof ScheduleKeyDeletionCommand,
      ),
    ).toBe(false);
    expect(report.results[0]).toEqual(
      expect.objectContaining({
        status: CleanupStatus.DeletionScheduled,
        expectedDeletionAt: DELETION_DATE.toISOString(),
      }),
    );
  });

  it("marks the audit deleted after a scheduled key disappears from KMS", async () => {
    candidates = [
      { ...candidate, cleanup_status: CleanupStatus.DeletionScheduled },
    ];
    kmsSendMock.mockImplementation(async (command: unknown) => {
      if (command instanceof DescribeKeyCommand) {
        const keyId = command.input.KeyId;
        if (keyId === OLD_KEY_ARN) {
          const error = new Error("Key not found");
          error.name = "NotFoundException";
          throw error;
        }
        return kmsMetadata(keyId ?? "");
      }
      throw new Error("Unexpected KMS command");
    });

    const report = await cleanupRpManagerKeys(primaryOnly);

    expect(report.results[0]?.status).toBe(CleanupStatus.Deleted);
  });
});

// #endregion
