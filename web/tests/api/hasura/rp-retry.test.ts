import { POST } from "@/api/hasura/rp-retry";
import { NextRequest } from "next/server";

// #region Mocks
const requestMock = jest.fn();
const getKMSClientMock = jest.fn();
const getEthAddressFromKMSMock = jest.fn();
const getRpFromContractMock = jest.fn();
const submitRegisterMock = jest.fn();
const submitRotateMock = jest.fn();
jest.mock("@/api/helpers/graphql", () => ({
  getAPIServiceGraphqlClient: jest.fn(async () => ({ request: requestMock })),
}));
jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
jest.mock("@/api/helpers/kms", () => ({
  getKMSClient: (...args: unknown[]) => getKMSClientMock(...args),
}));
jest.mock("@/api/helpers/kms-eth", () => ({
  getEthAddressFromKMS: (...args: unknown[]) =>
    getEthAddressFromKMSMock(...args),
}));
jest.mock("@/api/helpers/temporal-rpc", () => ({
  getRpFromContract: (...args: unknown[]) => getRpFromContractMock(...args),
}));
jest.mock("@/api/helpers/rp-transactions", () => ({
  submitRegisterRpTransaction: (...args: unknown[]) =>
    submitRegisterMock(...args),
  submitRotateSignerTransaction: (...args: unknown[]) =>
    submitRotateMock(...args),
}));
// #endregion

// #region Test Data
const rpId = "rp_0123456789abcdef";
const appId = "app_9cdd0a714aec9ed17dca660bc9ffe72a";
const teamId = "team_dd2ecd36c6c45f645e8e5d9a31abdee1";
const manager = "0x2222222222222222222222222222222222222222";
const signer = "0x1111111111111111111111111111111111111111";
const makeDbRecord = (overrides = {}) => ({
  rp_id: rpId,
  app_id: appId,
  mode: "managed",
  status: "failed",
  staging_status: "failed",
  signer_address: signer,
  manager_kms_key_id: "saved-key",
  app: { id: appId, team_id: teamId, app_metadata: [{ name: "Test App" }] },
  ...overrides,
});
let record: ReturnType<typeof makeDbRecord> | null;
let authorized: boolean;
const getOperationName = (query: any): string =>
  typeof query === "string" ? query : query.definitions[0].name.value;
const createMockRequest = (environment = "production") =>
  new NextRequest("http://localhost/api/hasura/rp-retry", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer internal-secret",
    },
    body: JSON.stringify({
      action: { name: "retry_rp" },
      session_variables: { "x-hasura-user-id": "user_123" },
      input: { rp_id: rpId, environment },
    }),
  });
const retryMutations = () =>
  requestMock.mock.calls.filter(([query]) =>
    /Update(Production|Staging)Retry/.test(getOperationName(query)),
  );
// #endregion

beforeEach(async () => {
  jest.clearAllMocks();
  await (global.RedisClient as { flushall: () => Promise<unknown> }).flushall();
  Object.assign(process.env, {
    INTERNAL_ENDPOINTS_SECRET: "internal-secret",
    RP_REGISTRY_SAFE_OWNER_KMS_KEY_ID: "safe-owner-key",
    RP_REGISTRY_CONTRACT_ADDRESS: "0x3333333333333333333333333333333333333333",
    RP_REGISTRY_SAFE_ADDRESS: "0x4444444444444444444444444444444444444444",
    RP_REGISTRY_ENTRYPOINT_ADDRESS:
      "0x5555555555555555555555555555555555555555",
    RP_REGISTRY_SAFE_4337_MODULE_ADDRESS:
      "0x6666666666666666666666666666666666666666",
    RP_REGISTRY_KMS_REGION: "us-east-1",
    RP_REGISTRY_DOMAIN_SEPARATOR: "0xprimary-domain",
    RP_REGISTRY_UPDATE_RP_TYPEHASH: "0xprimary-typehash",
    CREDENTIAL_SCHEMA_ISSUER_REGISTRY_ADDRESS:
      "0x7777777777777777777777777777777777777777",
    RP_REGISTRY_STAGING_CONTRACT_ADDRESS:
      "0x8888888888888888888888888888888888888888",
    RP_REGISTRY_STAGING_DOMAIN_SEPARATOR: "0xstaging-domain",
    RP_REGISTRY_STAGING_UPDATE_RP_TYPEHASH: "0xstaging-typehash",
  });
  record = makeDbRecord();
  authorized = true;
  getKMSClientMock.mockReset().mockResolvedValue({});
  getEthAddressFromKMSMock.mockReset().mockResolvedValue(manager);
  getRpFromContractMock.mockReset().mockResolvedValue({ initialized: false });
  submitRegisterMock.mockReset().mockResolvedValue("0xregister");
  submitRotateMock.mockReset().mockResolvedValue("0xrotate");
  requestMock.mockImplementation(async (query: unknown) => {
    const operation = getOperationName(query);
    if (operation.includes("GetRpRegistrationForRetry"))
      return { rp_registration_by_pk: record };
    if (operation.includes("CheckUserInApp"))
      return { team: authorized ? [{ id: teamId }] : [] };
    if (/Update(Production|Staging)Retry/.test(operation))
      return { update_rp_registration_by_pk: { rp_id: rpId } };
    throw new Error(`Unexpected query: ${operation}`);
  });
});

// #region Saved registration lifecycle
describe("/api/hasura/rp-retry", () => {
  it.each(["production", "staging"])(
    "reuses the saved registration for %s and updates only that environment",
    async (environment) => {
      const response = await POST(createMockRequest(environment));
      expect(await response!.json()).toEqual({
        success: true,
        environment,
        operation_hash: "0xregister",
      });
      expect(getEthAddressFromKMSMock).toHaveBeenCalledWith(
        {},
        "saved-key",
        "us-east-1",
      );
      expect(submitRegisterMock).toHaveBeenCalledWith(
        expect.objectContaining({
          contractAddress:
            environment === "production"
              ? process.env.RP_REGISTRY_CONTRACT_ADDRESS
              : process.env.RP_REGISTRY_STAGING_CONTRACT_ADDRESS,
        }),
        {
          rpId: 0x0123456789abcdefn,
          managerAddress: manager,
          signerAddress: signer,
          appName: "Test App",
          kmsClient: {},
        },
      );
      expect(retryMutations()).toHaveLength(1);
      expect(retryMutations()[0][1]).toEqual(
        environment === "production"
          ? { rp_id: rpId, operation_hash: "0xregister", status: "pending" }
          : {
              rp_id: rpId,
              staging_operation_hash: "0xregister",
              staging_status: "pending",
            },
      );
    },
  );

  it("does not submit again when the manager and signer already match", async () => {
    getRpFromContractMock.mockResolvedValue({
      initialized: true,
      manager,
      signer,
    });
    const response = await POST(createMockRequest());
    expect(await response!.json()).toEqual({
      success: true,
      environment: "production",
      operation_hash: null,
    });
    expect(submitRegisterMock).not.toHaveBeenCalled();
    expect(submitRotateMock).not.toHaveBeenCalled();
    expect(retryMutations()).toHaveLength(0);
  });

  it("retries rotation with the saved signer and manager key", async () => {
    getRpFromContractMock.mockResolvedValue({
      initialized: true,
      manager,
      signer: manager,
    });
    const response = await POST(createMockRequest());
    expect((await response!.json()).operation_hash).toBe("0xrotate");
    expect(submitRotateMock).toHaveBeenCalledWith(expect.anything(), {
      rpId: 0x0123456789abcdefn,
      newSignerAddress: signer,
      managerKmsKeyId: "saved-key",
      kmsClient: {},
    });
    expect(submitRegisterMock).not.toHaveBeenCalled();
  });

  it("rejects a registration controlled by a foreign manager", async () => {
    getRpFromContractMock.mockResolvedValue({
      initialized: true,
      manager: signer,
      signer,
    });
    const response = await POST(createMockRequest());
    expect((await response!.json()).extensions.code).toBe("rp_id_taken");
    expect(submitRegisterMock).not.toHaveBeenCalled();
    expect(submitRotateMock).not.toHaveBeenCalled();
    expect(retryMutations()).toHaveLength(0);
  });

  it("authorizes the user before touching KMS or the contract", async () => {
    authorized = false;
    const response = await POST(createMockRequest());
    expect((await response!.json()).extensions.code).toBe("unauthorized");
    expect(getKMSClientMock).not.toHaveBeenCalled();
    expect(getRpFromContractMock).not.toHaveBeenCalled();
  });

  it.each([
    ["not_found", null],
    ["not_managed", makeDbRecord({ mode: "self_managed" })],
    ["missing_signer", makeDbRecord({ signer_address: null })],
  ])("rejects %s before external calls", async (code, value) => {
    record = value as typeof record;
    const response = await POST(createMockRequest());
    expect((await response!.json()).extensions.code).toBe(code);
    expect(getKMSClientMock).not.toHaveBeenCalled();
    expect(getRpFromContractMock).not.toHaveBeenCalled();
  });

  it("reports incomplete environment configuration", async () => {
    delete process.env.RP_REGISTRY_STAGING_CONTRACT_ADDRESS;
    const response = await POST(createMockRequest("staging"));
    expect((await response!.json()).extensions.code).toBe(
      "environment_not_configured",
    );
    expect(getKMSClientMock).not.toHaveBeenCalled();
  });

  it.each(["kms_error", "rpc_error", "submission_error"])(
    "preserves saved state after %s",
    async (code) => {
      const error = new Error("Unavailable");
      if (code === "kms_error") getKMSClientMock.mockRejectedValue(error);
      if (code === "rpc_error") getRpFromContractMock.mockRejectedValue(error);
      if (code === "submission_error")
        submitRegisterMock.mockRejectedValue(error);
      const response = await POST(createMockRequest());
      expect((await response!.json()).extensions.code).toBe(code);
      expect(retryMutations()).toHaveLength(0);
      expect(
        requestMock.mock.calls.map(([query]) => getOperationName(query)),
      ).toEqual(["GetRpRegistrationForRetry", "CheckUserInApp"]);
    },
  );
});
// #endregion
