import { POST } from "@/api/hasura/rp-retry";
import {
  readRpStatusCache,
  writeRpStatusCache,
} from "@/api/helpers/rp-status-cache";
import { NextRequest } from "next/server";

// #region Mocks
const requestMock = jest.fn();
const getKMSClientMock = jest.fn();
const createManagerKeyMock = jest.fn();
const scheduleKeyDeletionMock = jest.fn();
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
  scheduleKeyDeletion: (...args: unknown[]) => scheduleKeyDeletionMock(...args),
}));
jest.mock("@/api/helpers/kms-eth", () => ({
  createManagerKey: (...args: unknown[]) => createManagerKeyMock(...args),
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
  is_unique_manager_key: true,
  operation_hash: null,
  staging_operation_hash: null,
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
  delete process.env.ENABLE_SHARED_KEY_RP_REGISTRATION;
  createManagerKeyMock.mockResolvedValue({
    keyId: "recovered-key",
    address: manager,
  });
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
    if (operation.includes("PrepareRpRegistration")) {
      if (!record?.manager_kms_key_id) {
        record = { ...record!, manager_kms_key_id: "recovered-key" };
        return { update_rp_registration: { affected_rows: 1 } };
      }
      return { update_rp_registration: { affected_rows: 0 } };
    }
    if (operation.includes("CheckUserInApp"))
      return { team: authorized ? [{ id: teamId }] : [] };
    if (/Claim(Production|Staging)RpRetry/.test(operation)) {
      const field = operation.includes("Production")
        ? "status"
        : "staging_status";
      if (record?.[field] !== "failed")
        return { update_rp_registration: { affected_rows: 0, returning: [] } };
      record = { ...record!, [field]: "pending" };
      return {
        update_rp_registration: {
          affected_rows: 1,
          returning: [{ updated_at: "2026-09-30T12:00:00Z" }],
        },
      };
    }
    if (/Update(Production|Staging)Retry/.test(operation))
      return { update_rp_registration: { affected_rows: 1 } };
    throw new Error(`Unexpected query: ${operation}`);
  });
});

// #region Saved registration lifecycle
describe("/api/hasura/rp-retry", () => {
  it("invalidates pre-claim cache writes even when submission times out", async () => {
    const snapshot = (await readRpStatusCache(rpId))!;
    const staleStatus = JSON.stringify({
      production_status: "failed",
      staging_status: "failed",
    });
    await writeRpStatusCache(rpId, snapshot.generation, staleStatus, 3600);
    submitRegisterMock.mockRejectedValue(new Error("Submission timed out"));

    const response = await POST(createMockRequest());

    expect((await response!.json()).extensions.code).toBe("submission_error");
    expect(record?.status).toBe("pending");
    expect(
      await writeRpStatusCache(rpId, snapshot.generation, staleStatus, 3600),
    ).toBe(0);
    expect(await global.RedisClient?.get(`rp_status:v2:${rpId}`)).toBeNull();
  });

  it("invalidates cache writes started during a staging retry before it completes", async () => {
    let duringRetryGeneration!: string;
    const staleStatus = JSON.stringify({
      production_status: "failed",
      staging_status: "pending",
    });
    submitRegisterMock.mockImplementation(async () => {
      duringRetryGeneration = (await readRpStatusCache(rpId))!.generation;
      await writeRpStatusCache(rpId, duringRetryGeneration, staleStatus, 1);
      return "0xregister";
    });

    const response = await POST(createMockRequest("staging"));

    expect((await response!.json()).success).toBe(true);
    expect(await global.RedisClient?.get(`rp_status:v2:${rpId}`)).toBeNull();
    expect(
      await writeRpStatusCache(rpId, duringRetryGeneration, staleStatus, 1),
    ).toBe(0);
  });

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
          ? {
              rp_id: rpId,
              claimed_at: "2026-09-30T12:00:00Z",
              operation_hash: "0xregister",
              status: "pending",
            }
          : {
              rp_id: rpId,
              claimed_at: "2026-09-30T12:00:00Z",
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

  it.each(["production", "staging"])(
    "rejects pending %s retries without submitting",
    async (environment) => {
      record = makeDbRecord({
        [environment === "production" ? "status" : "staging_status"]: "pending",
      });
      const response = await POST(createMockRequest(environment));
      expect((await response!.json()).extensions.code).toBe(
        "retry_not_available",
      );
      expect(getKMSClientMock).not.toHaveBeenCalled();
      expect(submitRegisterMock).not.toHaveBeenCalled();
    },
  );

  it("allows only one concurrent retry to submit", async () => {
    const responses = await Promise.all([
      POST(createMockRequest()),
      POST(createMockRequest()),
    ]);
    expect(responses.map((response) => response!.status).sort()).toEqual([
      200, 400,
    ]);
    expect(submitRegisterMock).toHaveBeenCalledTimes(1);
    expect(record!.status).toBe("pending");
  });

  it.each(["production", "staging"])(
    "returns the submitted hash when %s state persistence fails",
    async (environment) => {
      const original = requestMock.getMockImplementation()!;
      requestMock.mockImplementation((query, variables) => {
        if (/Update(Production|Staging)Retry/.test(getOperationName(query)))
          throw new Error("database unavailable");
        return original(query, variables);
      });
      const response = await POST(createMockRequest(environment));
      expect(response!.status).toBe(400);
      expect((await response!.json()).extensions).toEqual({
        code: "db_error",
        operation_hash: "0xregister",
        environment,
      });
      expect(
        record![environment === "production" ? "status" : "staging_status"],
      ).toBe("pending");
      const second = await POST(createMockRequest(environment));
      expect((await second!.json()).extensions.code).toBe(
        "retry_not_available",
      );
      expect(submitRegisterMock).toHaveBeenCalledTimes(1);
    },
  );

  it("does not submit when the claim result is uncertain", async () => {
    const original = requestMock.getMockImplementation()!;
    requestMock.mockImplementation((query, variables) => {
      const result = original(query, variables);
      if (getOperationName(query).includes("ClaimProductionRpRetry"))
        throw new Error("response timeout");
      return result;
    });
    const response = await POST(createMockRequest());
    expect((await response!.json()).extensions.code).toBe("db_error");
    expect(record!.status).toBe("pending");
    expect(submitRegisterMock).not.toHaveBeenCalled();
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
      ).toEqual([
        "GetRpRegistrationForRetry",
        "CheckUserInApp",
        ...(code === "submission_error" ? ["ClaimProductionRpRetry"] : []),
      ]);
    },
  );
});
// #endregion

// #region Missing manager key recovery
describe("/api/hasura/rp-retry [manager key recovery]", () => {
  beforeEach(() => {
    record = makeDbRecord({ manager_kms_key_id: null });
  });

  it("recovers an interrupted allocation with its saved ID and signer", async () => {
    const response = await POST(createMockRequest());
    expect(response!.status).toBe(200);
    expect(record!.manager_kms_key_id).toBe("recovered-key");
    const prepareCall = requestMock.mock.calls.findIndex(([q]) =>
      getOperationName(q).includes("PrepareRpRegistration"),
    );
    expect(prepareCall).toBeGreaterThan(-1);
    expect(requestMock.mock.invocationCallOrder[prepareCall]).toBeLessThan(
      submitRegisterMock.mock.invocationCallOrder[0],
    );
    expect(submitRegisterMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        rpId: 0x0123456789abcdefn,
        signerAddress: signer,
        managerAddress: manager,
      }),
    );
  });

  it.each([
    ["pending", { status: "pending" }, "production"],
    ["registered", { status: "registered" }, "production"],
    ["production operation", { operation_hash: "0xoperation" }, "production"],
    [
      "staging operation",
      { staging_operation_hash: "0xoperation" },
      "production",
    ],
    ["staging retry", {}, "staging"],
  ])(
    "does not prepare a key for %s",
    async (_label, overrides, environment) => {
      record = makeDbRecord({ manager_kms_key_id: null, ...overrides });
      const response = await POST(createMockRequest(environment));
      expect((await response!.json()).extensions.code).toBe(
        ["pending", "registered"].includes(_label)
          ? "retry_not_available"
          : "recovery_not_available",
      );
      expect(createManagerKeyMock).not.toHaveBeenCalled();
      expect(submitRegisterMock).not.toHaveBeenCalled();
    },
  );

  it("refuses recovery for an initialized contract", async () => {
    getRpFromContractMock.mockResolvedValue({
      initialized: true,
      manager,
      signer,
    });
    const response = await POST(createMockRequest());
    expect((await response!.json()).extensions.code).toBe(
      "recovery_not_available",
    );
    expect(createManagerKeyMock).not.toHaveBeenCalled();
    expect(submitRotateMock).not.toHaveBeenCalled();
  });

  it("keeps the record unchanged when the recovery contract read fails", async () => {
    getRpFromContractMock.mockRejectedValue(new Error("rpc timeout"));
    const response = await POST(createMockRequest());
    expect((await response!.json()).extensions.code).toBe("rpc_error");
    expect(record!.manager_kms_key_id).toBeNull();
    expect(createManagerKeyMock).not.toHaveBeenCalled();
  });

  it("uses a key saved between the handler read and the recovery reread", async () => {
    const original = requestMock.getMockImplementation()!;
    let reads = 0;
    requestMock.mockImplementation((q, vars) => {
      if (
        getOperationName(q).includes("GetRpRegistrationForRetry") &&
        ++reads === 2
      ) {
        record = makeDbRecord({ manager_kms_key_id: "competing-key" });
      }
      return original(q, vars);
    });
    const response = await POST(createMockRequest());
    expect(response!.status).toBe(200);
    expect(createManagerKeyMock).not.toHaveBeenCalled();
    expect(getEthAddressFromKMSMock).toHaveBeenCalledWith(
      {},
      "competing-key",
      "us-east-1",
    );
  });

  it("retains a key saved by a timed-out mutation and uses it on the next retry", async () => {
    const original = requestMock.getMockImplementation()!;
    requestMock.mockImplementation(async (q, vars) => {
      const result = await original(q, vars);
      if (getOperationName(q).includes("PrepareRpRegistration"))
        throw new Error("response timeout");
      return result;
    });
    const first = await POST(createMockRequest());
    expect((await first!.json()).extensions.code).toBe("db_error");
    expect(scheduleKeyDeletionMock).not.toHaveBeenCalled();
    expect(submitRegisterMock).not.toHaveBeenCalled();
    requestMock.mockImplementation(original);
    const second = await POST(createMockRequest());
    expect(second!.status).toBe(200);
    expect(createManagerKeyMock).toHaveBeenCalledTimes(1);
    expect(getEthAddressFromKMSMock).toHaveBeenCalledWith(
      {},
      "recovered-key",
      "us-east-1",
    );
  });

  it("reuses the recovered key after submit fails", async () => {
    submitRegisterMock.mockRejectedValueOnce(new Error("submit timeout"));
    const first = await POST(createMockRequest());
    expect((await first!.json()).extensions.code).toBe("submission_error");
    expect(record!.manager_kms_key_id).toBe("recovered-key");
    expect(record!.status).toBe("pending");
    record = { ...record!, status: "failed" }; // Status reconciliation expires the uncertain submission.
    const second = await POST(createMockRequest());
    expect(second!.status).toBe(200);
    expect(createManagerKeyMock).toHaveBeenCalledTimes(1);
    expect(scheduleKeyDeletionMock).not.toHaveBeenCalled();
  });
});
// #endregion
