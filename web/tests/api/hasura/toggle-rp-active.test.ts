import { POST } from "@/api/hasura/toggle-rp-active";
import { NextRequest } from "next/server";

// #region Mocks
const GetRpRegistration = jest.fn();
jest.mock(
  "@/api/hasura/toggle-rp-active/graphql/get-rp-registration.generated",
  () => ({ getSdk: () => ({ GetRpRegistration }) }),
);

const ClaimToggleSlot = jest.fn();
jest.mock(
  "@/api/hasura/toggle-rp-active/graphql/claim-toggle-slot.generated",
  () => ({ getSdk: () => ({ ClaimToggleSlot }) }),
);

const UpdateToggleResult = jest.fn();
jest.mock(
  "@/api/hasura/toggle-rp-active/graphql/update-toggle-result.generated",
  () => ({ getSdk: () => ({ UpdateToggleResult }) }),
);

const RevertToggleStatus = jest.fn();
jest.mock(
  "@/api/hasura/toggle-rp-active/graphql/revert-toggle-status.generated",
  () => ({ getSdk: () => ({ RevertToggleStatus }) }),
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
}));

const submitToggleRpActiveTransactionMock = jest.fn();
jest.mock("@/api/helpers/rp-transactions", () => ({
  submitToggleRpActiveTransaction: (...args: unknown[]) =>
    submitToggleRpActiveTransactionMock(...args),
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
  new NextRequest("http://localhost:3000/api/hasura/toggle-rp-active", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.INTERNAL_ENDPOINTS_SECRET}`,
    },
    body: JSON.stringify({
      action: { name: "toggle_rp_active" },
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
  ClaimToggleSlot.mockResolvedValue({
    update_rp_registration: { affected_rows: 1 },
  });
  RevertToggleStatus.mockResolvedValue({
    update_rp_registration: { affected_rows: 1 },
  });
  submitToggleRpActiveTransactionMock.mockResolvedValue("0xophash");
  UpdateToggleResult.mockResolvedValue({
    update_rp_registration_by_pk: { rp_id: rpId },
  });
});

// #region Manager key migration lock
describe("/api/hasura/toggle-rp-active [manager key migration lock]", () => {
  it("reverts the claim and rejects when the migration lock is held", async () => {
    await global.RedisClient?.set(
      `rp-manager-key-migration:rp:${rpId}`,
      "migration-owner",
    );

    const res = (await POST(createMockRequest({ app_id: appId })))!;
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.extensions.code).toBe("operation_in_progress");
    expect(ClaimToggleSlot).toHaveBeenCalledTimes(1);
    expect(RevertToggleStatus).toHaveBeenCalledWith({
      rp_id: rpId,
      previous_status: "registered",
    });
    expect(submitToggleRpActiveTransactionMock).not.toHaveBeenCalled();
  });

  it("submits the toggle when the migration lock is not held", async () => {
    const res = (await POST(createMockRequest({ app_id: appId })))!;

    expect(res.status).toBe(200);
    expect(submitToggleRpActiveTransactionMock).toHaveBeenCalledTimes(1);
    expect(RevertToggleStatus).not.toHaveBeenCalled();
  });
});
// #endregion
