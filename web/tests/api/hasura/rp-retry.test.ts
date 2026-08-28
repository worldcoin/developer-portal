import { POST } from "@/api/hasura/rp-retry";
import { NextRequest } from "next/server";

const GetRpRegistrationForRetry = jest.fn();
jest.mock(
  "@/api/hasura/rp-retry/graphql/get-rp-registration.generated",
  () => ({ getSdk: () => ({ GetRpRegistrationForRetry }) }),
);

const ClaimProductionRetry = jest.fn();
jest.mock(
  "@/api/hasura/rp-retry/graphql/claim-production-retry.generated",
  () => ({ getSdk: () => ({ ClaimProductionRetry }) }),
);

const CompleteProductionRetry = jest.fn();
jest.mock(
  "@/api/hasura/rp-retry/graphql/complete-production-retry.generated",
  () => ({ getSdk: () => ({ CompleteProductionRetry }) }),
);

const RevertProductionRetry = jest.fn();
jest.mock(
  "@/api/hasura/rp-retry/graphql/revert-production-retry.generated",
  () => ({ getSdk: () => ({ RevertProductionRetry }) }),
);

const ReconcileProductionRetry = jest.fn();
jest.mock(
  "@/api/hasura/rp-retry/graphql/reconcile-production-retry.generated",
  () => ({ getSdk: () => ({ ReconcileProductionRetry }) }),
);

const UpdateStagingRetry = jest.fn();
jest.mock(
  "@/api/hasura/rp-retry/graphql/update-staging-retry.generated",
  () => ({ getSdk: () => ({ UpdateStagingRetry }) }),
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

const getEthAddressFromKMSMock = jest.fn();
jest.mock("@/api/helpers/kms-eth", () => ({
  getEthAddressFromKMS: (...args: unknown[]) =>
    getEthAddressFromKMSMock(...args),
}));

const submitRegisterRpTransactionMock = jest.fn();
const submitRotateSignerTransactionMock = jest.fn();
jest.mock("@/api/helpers/rp-transactions", () => ({
  submitRegisterRpTransaction: (...args: unknown[]) =>
    submitRegisterRpTransactionMock(...args),
  submitRotateSignerTransaction: (...args: unknown[]) =>
    submitRotateSignerTransactionMock(...args),
}));

const getRpFromContractMock = jest.fn();
jest.mock("@/api/helpers/temporal-rpc", () => ({
  getRpFromContract: (...args: unknown[]) => getRpFromContractMock(...args),
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

const appId = "app_9cdd0a714aec9ed17dca660bc9ffe72a";
const teamId = "team_dd2ecd36c6c45f645e8e5d9a31abdee1";
const userId = "user_123";
const rpId = "rp_0123456789abcdef";
const signerAddress = "0x1111111111111111111111111111111111111111";
const managerAddress = "0x2222222222222222222222222222222222222222";

const createMockRequest = (environment: "production" | "staging") =>
  new NextRequest("http://localhost:3000/api/hasura/rp-retry", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.INTERNAL_ENDPOINTS_SECRET}`,
    },
    body: JSON.stringify({
      action: { name: "retry_rp" },
      session_variables: { "x-hasura-user-id": userId },
      input: { rp_id: rpId, environment },
    }),
  });

beforeEach(async () => {
  jest.clearAllMocks();
  await global.RedisClient?.flushall();
  process.env.INTERNAL_ENDPOINTS_SECRET = "internal-secret";
  mockGetRpRegistryConfig.mockReturnValue({
    contractAddress: "0xcontract",
    kmsRegion: "eu-west-1",
  });
  mockGetStagingRpRegistryConfig.mockReturnValue(null);
  GetRpRegistrationForRetry.mockResolvedValue({
    rp_registration_by_pk: {
      rp_id: rpId,
      app_id: appId,
      status: "failed",
      staging_status: null,
      mode: "managed",
      signer_address: signerAddress,
      manager_kms_key_id: "kms-key-id",
      app: {
        id: appId,
        team_id: teamId,
        app_metadata: [{ name: "Test App" }],
      },
    },
  });
  CheckUserInApp.mockResolvedValue({ team: [{ id: teamId }] });
  getEthAddressFromKMSMock.mockResolvedValue(managerAddress);
  getRpFromContractMock.mockResolvedValue({
    initialized: false,
    manager: "0x0000000000000000000000000000000000000000",
    signer: "0x0000000000000000000000000000000000000000",
  });
  submitRegisterRpTransactionMock.mockResolvedValue("0xoperation");
  ClaimProductionRetry.mockResolvedValue({
    update_rp_registration: { affected_rows: 1 },
  });
  CompleteProductionRetry.mockResolvedValue({
    update_rp_registration: { affected_rows: 1 },
  });
  RevertProductionRetry.mockResolvedValue({
    update_rp_registration: { affected_rows: 1 },
  });
  ReconcileProductionRetry.mockResolvedValue({
    update_rp_registration: { affected_rows: 1 },
  });
});

describe("/api/hasura/rp-retry production claim", () => {
  it("does not submit an on-chain transaction when the durable claim is unavailable", async () => {
    ClaimProductionRetry.mockResolvedValue({
      update_rp_registration: { affected_rows: 0 },
    });

    const response = (await POST(createMockRequest("production")))!;
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.extensions.code).toBe("operation_in_progress");
    expect(ClaimProductionRetry).toHaveBeenCalledTimes(1);
    expect(submitRegisterRpTransactionMock).not.toHaveBeenCalled();
    expect(submitRotateSignerTransactionMock).not.toHaveBeenCalled();
    expect(CompleteProductionRetry).not.toHaveBeenCalled();
  });

  it("claims before submitting and stores the operation under that claim", async () => {
    const response = (await POST(createMockRequest("production")))!;
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.operation_hash).toBe("0xoperation");
    expect(ClaimProductionRetry).toHaveBeenCalledWith({ rp_id: rpId });
    expect(ClaimProductionRetry.mock.invocationCallOrder[0]).toBeLessThan(
      submitRegisterRpTransactionMock.mock.invocationCallOrder[0],
    );
    expect(CompleteProductionRetry).toHaveBeenCalledWith({
      rp_id: rpId,
      operation_hash: "0xoperation",
    });
    expect(RevertProductionRetry).not.toHaveBeenCalled();
  });

  it("releases the claim when transaction submission fails", async () => {
    submitRegisterRpTransactionMock.mockRejectedValueOnce(
      new Error("bundler unavailable"),
    );

    const response = (await POST(createMockRequest("production")))!;
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.extensions.code).toBe("submission_error");
    expect(RevertProductionRetry).toHaveBeenCalledWith({ rp_id: rpId });
    expect(CompleteProductionRetry).not.toHaveBeenCalled();
  });

  it("reconciles a failed row that is already correct on-chain", async () => {
    getRpFromContractMock.mockResolvedValueOnce({
      initialized: true,
      manager: managerAddress,
      signer: signerAddress,
    });

    const response = (await POST(createMockRequest("production")))!;

    expect(response.status).toBe(200);
    expect(ClaimProductionRetry).not.toHaveBeenCalled();
    expect(submitRegisterRpTransactionMock).not.toHaveBeenCalled();
    expect(submitRotateSignerTransactionMock).not.toHaveBeenCalled();
    expect(ReconcileProductionRetry).toHaveBeenCalledWith({ rp_id: rpId });
  });
});
