import { POST } from "@/api/hasura/switch-to-self-managed";
import { scheduleKeyDeletion } from "@/api/helpers/kms";
import { NextRequest } from "next/server";

// #region Mocks
const GetRpRegistration = jest.fn();
jest.mock(
  "@/api/hasura/switch-to-self-managed/graphql/get-rp-registration.generated",
  () => ({ getSdk: () => ({ GetRpRegistration }) }),
);

const ClaimModeSwitchSlot = jest.fn();
jest.mock(
  "@/api/hasura/switch-to-self-managed/graphql/claim-mode-switch-slot.generated",
  () => ({ getSdk: () => ({ ClaimModeSwitchSlot }) }),
);

const UpdateModeSwitchResult = jest.fn();
jest.mock(
  "@/api/hasura/switch-to-self-managed/graphql/update-mode-switch-result.generated",
  () => ({ getSdk: () => ({ UpdateModeSwitchResult }) }),
);

const RevertModeSwitchStatus = jest.fn();
jest.mock(
  "@/api/hasura/switch-to-self-managed/graphql/revert-mode-switch-status.generated",
  () => ({ getSdk: () => ({ RevertModeSwitchStatus }) }),
);

const CheckUserInApp = jest.fn();
jest.mock("@/api/hasura/graphql/checkUserInApp.generated", () => ({
  getSdk: () => ({ CheckUserInApp }),
}));

jest.mock("@/api/helpers/graphql", () => ({
  getAPIServiceGraphqlClient: jest.fn().mockResolvedValue({}),
}));

jest.mock("@/api/helpers/kms", () => ({
  getKMSClient: jest.fn().mockResolvedValue({}),
  scheduleKeyDeletion: jest.fn(),
}));

const submitTransferManagerTransactionMock = jest.fn();
jest.mock("@/api/helpers/rp-transactions", () => ({
  submitTransferManagerTransaction: (...args: unknown[]) =>
    submitTransferManagerTransactionMock(...args),
}));

const mockGetRpRegistryConfig = jest.fn();
const mockGetStagingRpRegistryConfig = jest.fn();
jest.mock("@/api/helpers/rp-utils", () => {
  const actual = jest.requireActual("@/api/helpers/rp-utils");
  return {
    ...actual,
    getRpRegistryConfig: () => mockGetRpRegistryConfig(),
    getStagingRpRegistryConfig: () => mockGetStagingRpRegistryConfig(),
    parseRpId: () => 123n,
  };
});

jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
// #endregion

// #region Test Data
const appId = "app_9cdd0a714aec9ed17dca660bc9ffe72a";
const teamId = "team_dd2ecd36c6c45f645e8e5d9a31abdee1";
const userId = "user_123";
const rpId = "rp_0123456789abcdef";
const managerKmsKeyId =
  "arn:aws:kms:eu-west-1:000000000000:key/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
const newManagerAddress = "0x1111111111111111111111111111111111111111";

const makeRegistration = (overrides: Record<string, unknown> = {}) => ({
  rp_id: rpId,
  app_id: appId,
  mode: "managed",
  status: "registered",
  signer_address: "0x2222222222222222222222222222222222222222",
  manager_kms_key_id: managerKmsKeyId,
  is_unique_manager_key: true,
  operation_hash: null,
  app: {
    team_id: teamId,
    deleted_at: null,
    status: "active",
    is_archived: false,
  },
  ...overrides,
});

const createMockRequest = (input: Record<string, unknown>) =>
  new NextRequest("http://localhost:3000/api/hasura/switch-to-self-managed", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.INTERNAL_ENDPOINTS_SECRET}`,
    },
    body: JSON.stringify({
      action: { name: "switch_to_self_managed" },
      session_variables: {
        "x-hasura-user-id": userId,
      },
      input,
    }),
  });
// #endregion

beforeEach(async () => {
  jest.clearAllMocks();
  await global.RedisClient?.flushall();
  process.env.INTERNAL_ENDPOINTS_SECRET = "internal-secret";
  process.env.NEXT_PUBLIC_APP_ENV = "test";
  mockGetRpRegistryConfig.mockReturnValue({
    contractAddress: "0xcontract",
    kmsRegion: "eu-west-1",
  });
  mockGetStagingRpRegistryConfig.mockReturnValue(null);
  GetRpRegistration.mockResolvedValue({
    rp_registration: [makeRegistration()],
  });
  CheckUserInApp.mockResolvedValue({ team: [{ id: teamId }] });
  ClaimModeSwitchSlot.mockResolvedValue({
    update_rp_registration: { affected_rows: 1 },
  });
  RevertModeSwitchStatus.mockResolvedValue({
    update_rp_registration: { affected_rows: 1 },
  });
  submitTransferManagerTransactionMock.mockResolvedValue("0xophash");
  UpdateModeSwitchResult.mockResolvedValue({
    update_rp_registration_by_pk: { rp_id: rpId },
  });
});

// #region KMS key deletion guard
describe("/api/hasura/switch-to-self-managed [key deletion]", () => {
  it("schedules key deletion when the manager key is dedicated", async () => {
    const res = (await POST(
      createMockRequest({
        app_id: appId,
        new_manager_address: newManagerAddress,
      }),
    ))!;

    expect(res.status).toBe(200);
    expect(submitTransferManagerTransactionMock).toHaveBeenCalledTimes(1);
    expect(UpdateModeSwitchResult).toHaveBeenCalledWith({
      rp_id: rpId,
      operation_hash: "0xophash",
    });
    expect(scheduleKeyDeletion).toHaveBeenCalledWith(
      expect.anything(),
      managerKmsKeyId,
    );
  });

  it("does not schedule key deletion when the manager key is shared", async () => {
    GetRpRegistration.mockResolvedValue({
      rp_registration: [makeRegistration({ is_unique_manager_key: false })],
    });

    const res = (await POST(
      createMockRequest({
        app_id: appId,
        new_manager_address: newManagerAddress,
      }),
    ))!;

    expect(res.status).toBe(200);
    expect(submitTransferManagerTransactionMock).toHaveBeenCalledTimes(1);
    expect(UpdateModeSwitchResult).toHaveBeenCalledWith({
      rp_id: rpId,
      operation_hash: "0xophash",
    });
    expect(scheduleKeyDeletion).not.toHaveBeenCalled();
  });
});
// #endregion

// #region Manager key migration lock
describe("/api/hasura/switch-to-self-managed [manager key migration lock]", () => {
  it("reverts the claim and rejects when the migration lock is held", async () => {
    await global.RedisClient?.set(
      `rp-manager-key-migration:rp:${rpId}`,
      "migration-owner",
    );

    const res = (await POST(
      createMockRequest({
        app_id: appId,
        new_manager_address: newManagerAddress,
      }),
    ))!;
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.extensions.code).toBe("operation_in_progress");
    expect(ClaimModeSwitchSlot).toHaveBeenCalledTimes(1);
    expect(RevertModeSwitchStatus).toHaveBeenCalledWith({ rp_id: rpId });
    expect(submitTransferManagerTransactionMock).not.toHaveBeenCalled();
  });

  it("reverts the claim and rejects when Redis is unavailable", async () => {
    const redis = global.RedisClient;
    global.RedisClient = undefined;

    try {
      const res = (await POST(
        createMockRequest({
          app_id: appId,
          new_manager_address: newManagerAddress,
        }),
      ))!;
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.extensions.code).toBe("operation_in_progress");
      expect(ClaimModeSwitchSlot).toHaveBeenCalledTimes(1);
      expect(RevertModeSwitchStatus).toHaveBeenCalledWith({ rp_id: rpId });
      expect(submitTransferManagerTransactionMock).not.toHaveBeenCalled();
    } finally {
      global.RedisClient = redis;
    }
  });

  it("reverts the claim and rejects when the migration lock read fails", async () => {
    const redis = global.RedisClient;
    global.RedisClient = {
      get: () => Promise.reject(new Error("simulated Redis outage")),
    } as unknown as typeof global.RedisClient;

    try {
      const res = (await POST(
        createMockRequest({
          app_id: appId,
          new_manager_address: newManagerAddress,
        }),
      ))!;
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.extensions.code).toBe("operation_in_progress");
      expect(ClaimModeSwitchSlot).toHaveBeenCalledTimes(1);
      expect(RevertModeSwitchStatus).toHaveBeenCalledWith({ rp_id: rpId });
      expect(submitTransferManagerTransactionMock).not.toHaveBeenCalled();
    } finally {
      global.RedisClient = redis;
    }
  });
});
// #endregion
