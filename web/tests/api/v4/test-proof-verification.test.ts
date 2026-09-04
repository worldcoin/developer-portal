import { mintTestProof } from "@/api/helpers/test-proofs";
import { POST } from "@/api/v4/verify";
import { NextRequest } from "next/server";
import { semaphoreProofParamsMock } from "../__mocks__/proof.mock";

// #region Mocks
const FetchRpRegistrationByRpId = jest.fn();
const FetchActionV4 = jest.fn();
const CreateActionV4 = jest.fn();
const CheckNullifierV4 = jest.fn();
const InsertNullifierV4 = jest.fn();
const mockVerifyProofOnChain = jest.fn();
const mockVerifySessionProofOnChain = jest.fn();
const mockCaptureEvent = jest.fn();

jest.mock("../../../lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
jest.mock("dd-trace", () => ({ dogstatsd: { increment: jest.fn() } }));
jest.mock("../../../services/posthogClient", () => ({
  captureEvent: (...args: unknown[]) => mockCaptureEvent(...args),
}));
jest.mock("../../../api/helpers/graphql", () => ({
  getAPIServiceGraphqlClient: jest.fn().mockResolvedValue({}),
}));
jest.mock(
  "../../../api/helpers/graphql/fetch-rp-registration.generated",
  () => ({
    getSdk: () => ({ FetchRpRegistrationByRpId }),
  }),
);
jest.mock("../../../api/v4/verify/graphql/fetch-action-v4.generated", () => ({
  getSdk: () => ({ FetchActionV4 }),
}));
jest.mock("../../../api/v4/verify/graphql/create-action-v4.generated", () => ({
  getSdk: () => ({ CreateActionV4 }),
}));
jest.mock(
  "../../../api/v4/verify/graphql/check-nullifier-v4.generated",
  () => ({
    getSdk: () => ({ CheckNullifierV4 }),
  }),
);
jest.mock(
  "../../../api/v4/verify/graphql/insert-nullifier-v4.generated",
  () => ({
    getSdk: () => ({ InsertNullifierV4 }),
  }),
);
jest.mock("../../../api/helpers/temporal-rpc", () => ({
  ...jest.requireActual("../../../api/helpers/temporal-rpc"),
  verifyProofOnChain: (...args: unknown[]) => mockVerifyProofOnChain(...args),
  verifySessionProofOnChain: (...args: unknown[]) =>
    mockVerifySessionProofOnChain(...args),
}));
// #endregion

// #region Test Data
const appId = "app_0123456789abcdef0123456789abcdef";
const rpId = "rp_0123456789abcdef";
const action = "signup";
const createdAt = "2026-09-04T12:00:00.000Z";
const actionRecord = {
  id: "action-v4-id",
  action,
  rp_id: rpId,
  environment: "staging",
};

const makeRegistration = () => ({
  rp_id: rpId,
  app_id: appId,
  status: "registered",
  app: {
    id: appId,
    status: "active",
    is_archived: false,
    deleted_at: null,
    app_metadata: [{ app_mode: "external" }],
  },
});

const mint = async (
  outcome: "success" | "expired" | "invalid_proof" = "success",
) =>
  (await mintTestProof({ rpId, action, teamId: "team-test", outcome })).payload;

const verify = (body: unknown, routeId = rpId) =>
  POST(
    new NextRequest(`http://localhost/api/v4/verify/${routeId}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ app_id: routeId }) },
  );
// #endregion

beforeEach(async () => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
  process.env.VERIFIER_CONTRACT_ADDRESS = "0xproduction";
  process.env.VERIFIER_CONTRACT_ADDRESS_STAGING = "0xstaging";
  await global.RedisClient!.flushall();
  FetchRpRegistrationByRpId.mockResolvedValue({
    rp_registration: [makeRegistration()],
  });
  FetchActionV4.mockResolvedValue({ action_v4: [] });
  CreateActionV4.mockResolvedValue({ insert_action_v4_one: actionRecord });
  CheckNullifierV4.mockResolvedValue({ nullifier_v4: [] });
  InsertNullifierV4.mockResolvedValue({
    insert_nullifier_v4_one: { id: "nullifier-id", created_at: createdAt },
  });
  mockVerifyProofOnChain.mockResolvedValue({ success: true });
  mockVerifySessionProofOnChain.mockResolvedValue({ success: true });
});

afterEach(() => {
  jest.restoreAllMocks();
});

// #region Real handler bookkeeping
describe("/api/v4/verify [synthetic chain verdicts]", () => {
  it("runs lazy action creation and the ordinary insert and analytics", async () => {
    const payload = await mint();
    const response = await verify(payload);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      success: true,
      test: true,
      action,
      environment: "staging",
      protocol_version: "4.0",
      nullifier: payload.responses[0].nullifier,
    });
    expect(body.results[0]).not.toHaveProperty("test");
    expect(mockVerifyProofOnChain).not.toHaveBeenCalled();
    expect(CreateActionV4).toHaveBeenCalledWith({
      rp_id: rpId,
      action,
      description: "",
      environment: "staging",
    });
    expect(InsertNullifierV4).toHaveBeenCalledWith({
      action_v4_id: actionRecord.id,
      nullifier: BigInt(payload.responses[0].nullifier).toString(),
    });
    expect(mockCaptureEvent).toHaveBeenCalledWith(
      expect.objectContaining({ event: "action_verify_v4_success" }),
    );
  });

  it("keeps the actual v4 HTTP 200 reuse behavior on replay", async () => {
    const payload = await mint();
    expect((await verify(payload)).status).toBe(200);
    FetchActionV4.mockResolvedValue({ action_v4: [actionRecord] });
    CheckNullifierV4.mockResolvedValue({
      nullifier_v4: [{ created_at: createdAt }],
    });

    const replay = await verify(payload);
    expect(replay.status).toBe(200);
    await expect(replay.json()).resolves.toMatchObject({
      test: true,
      success: true,
      message: "Proof verified successfully (nullifier reuse)",
      created_at: createdAt,
    });
    expect(InsertNullifierV4).toHaveBeenCalledTimes(1);
    expect(CreateActionV4).toHaveBeenCalledTimes(1);
    expect(mockVerifyProofOnChain).not.toHaveBeenCalled();
  });

  it("preserves success on the real duplicate-insert error branch", async () => {
    const payload = await mint();
    InsertNullifierV4.mockRejectedValue(new Error("duplicate key value"));
    const response = await verify(payload);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      test: true,
      success: true,
      message: "Proof verified successfully (nullifier reuse)",
    });
  });

  it.each([
    ["expired", "outdated_nullifier"],
    ["invalid_proof", "invalid_proof"],
  ] as const)(
    "maps %s through the ordinary failure response",
    async (outcome, code) => {
      const response = await verify(await mint(outcome));
      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toMatchObject({
        test: true,
        success: false,
        code: "all_verifications_failed",
        results: [expect.objectContaining({ success: false, code })],
      });
      expect(CreateActionV4).not.toHaveBeenCalled();
      expect(InsertNullifierV4).not.toHaveBeenCalled();
      expect(mockVerifyProofOnChain).not.toHaveBeenCalled();
    },
  );

  it("retains first-success ordering for mixed real and test results", async () => {
    const payload = await mint("invalid_proof");
    const realItem = {
      ...payload.responses[0],
      identifier: "real-first",
      nullifier: "0x123",
    };
    const response = await verify({
      ...payload,
      responses: [realItem, payload.responses[0]],
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      test: true,
      nullifier: "0x123",
      results: [
        { identifier: "real-first", success: true, nullifier: "0x123" },
        expect.objectContaining({ success: false, code: "invalid_proof" }),
      ],
    });
    expect(InsertNullifierV4).toHaveBeenCalledWith({
      action_v4_id: actionRecord.id,
      nullifier: "291",
    });
    expect(mockVerifyProofOnChain).toHaveBeenCalledTimes(1);
  });
});
// #endregion

// #region Fences and unchanged request guards
describe("/api/v4/verify [synthetic fences]", () => {
  it.each(["production", undefined, "sandbox"])(
    "never reads the store for environment %s",
    async (environment) => {
      const payload = await mint();
      const get = jest.spyOn(global.RedisClient!, "get");
      const response = await verify({ ...payload, environment, test: true });
      expect(response.status).toBe(200);
      expect(await response.json()).not.toHaveProperty("test");
      expect(get).not.toHaveBeenCalled();
      expect(mockVerifyProofOnChain).toHaveBeenCalledTimes(1);
    },
  );

  it.each(["rp", "action"])(
    "refuses a record for a different %s",
    async (field) => {
      const payload = await mint();
      if (field === "rp") {
        FetchRpRegistrationByRpId.mockResolvedValue({
          rp_registration: [
            { ...makeRegistration(), rp_id: "rp_ffffffffffffffff" },
          ],
        });
      }
      mockVerifyProofOnChain.mockResolvedValue({
        success: false,
        error: { code: "invalid_proof", detail: "The proof is invalid." },
      });
      const response = await verify(
        {
          ...payload,
          action: field === "action" ? "other-action" : action,
        },
        field === "rp" ? "rp_ffffffffffffffff" : rpId,
      );
      expect(response.status).toBe(400);
      expect(await response.json()).not.toHaveProperty("test");
      expect(mockVerifyProofOnChain).toHaveBeenCalledTimes(1);
      expect(InsertNullifierV4).not.toHaveBeenCalled();
    },
  );

  it("falls through to real verification on Redis failure", async () => {
    const payload = await mint();
    jest
      .spyOn(global.RedisClient!, "get")
      .mockRejectedValue(new Error("Redis unavailable"));
    const response = await verify(payload);
    expect(response.status).toBe(200);
    expect(await response.json()).not.toHaveProperty("test");
    expect(mockVerifyProofOnChain).toHaveBeenCalledTimes(1);
    expect(InsertNullifierV4).toHaveBeenCalledTimes(1);
  });

  it("does not trust client test markers on an ordinary store miss", async () => {
    const payload = await mint();
    await global.RedisClient!.flushall();
    const response = await verify({
      ...payload,
      test: true,
      responses: [{ ...payload.responses[0], test: true }],
    });
    const body = await response.json();
    expect(body).not.toHaveProperty("test");
    expect(body.results[0]).not.toHaveProperty("test");
    expect(mockVerifyProofOnChain).toHaveBeenCalledTimes(1);
  });

  it.each(["schema", "conversion"])(
    "rejects malformed %s input before store lookup",
    async (kind) => {
      const payload = await mint();
      const get = jest.spyOn(global.RedisClient!, "get");
      const response = await verify({
        ...payload,
        responses: [
          {
            ...payload.responses[0],
            proof:
              kind === "schema" ? ["0x1"] : ["bad", "0x2", "0x3", "0x4", "0x5"],
          },
        ],
      });
      expect(response.status).toBe(400);
      expect(await response.json()).not.toHaveProperty("test");
      expect(get).not.toHaveBeenCalled();
      expect(mockVerifyProofOnChain).not.toHaveBeenCalled();
    },
  );

  it("preserves the Self Check integrity guard before synthetic recognition", async () => {
    const payload = await mint();
    const get = jest.spyOn(global.RedisClient!, "get");
    const response = await verify({
      ...payload,
      responses: [
        {
          ...payload.responses[0],
          identifier: "selfie",
          issuer_schema_id: 11,
          sybil_score: 10,
        },
      ],
    });
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      code: "integrity_verification_failed",
    });
    expect(get).not.toHaveBeenCalled();
    expect(mockVerifyProofOnChain).not.toHaveBeenCalled();
  });

  it("preserves the protocol floor before RP resolution or store access", async () => {
    const get = jest.spyOn(global.RedisClient!, "get");
    const response = await verify({
      protocol_version: "3.0",
      min_protocol_version: "4.0",
      environment: "staging",
      nonce: "1",
      action,
      responses: [
        {
          identifier: "orb",
          merkle_root: "0x1",
          nullifier: "0x2",
          proof: "0x3",
        },
      ],
    });
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: "protocol_version_not_allowed",
    });
    expect(FetchRpRegistrationByRpId).not.toHaveBeenCalled();
    expect(get).not.toHaveBeenCalled();
  });

  it("keeps protocol 3.0 on the actual sequencer path", async () => {
    const get = jest.spyOn(global.RedisClient!, "get");
    const fetch = jest
      .spyOn(global, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify({ valid: true }), { status: 200 }),
      );
    const response = await verify({
      protocol_version: "3.0",
      environment: "staging",
      nonce: "1",
      action,
      responses: [
        {
          identifier: "orb",
          signal_hash: semaphoreProofParamsMock.signal_hash,
          merkle_root: semaphoreProofParamsMock.merkle_root,
          nullifier: semaphoreProofParamsMock.nullifier_hash,
          proof: semaphoreProofParamsMock.proof,
        },
      ],
    });
    expect(response.status).toBe(200);
    expect(await response.json()).not.toHaveProperty("test");
    expect(get).not.toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(mockVerifyProofOnChain).not.toHaveBeenCalled();
  });

  it("keeps session proofs on the actual session verifier path", async () => {
    const payload = await mint();
    const get = jest.spyOn(global.RedisClient!, "get");
    const response = await verify({
      ...payload,
      action: undefined,
      session_id: "0x1",
      responses: [
        {
          ...payload.responses[0],
          session_nullifier: [payload.responses[0].nullifier, "0x1"],
        },
      ],
    });
    expect(response.status).toBe(200);
    expect(await response.json()).not.toHaveProperty("test");
    expect(get).not.toHaveBeenCalled();
    expect(mockVerifySessionProofOnChain).toHaveBeenCalledTimes(1);
    expect(mockVerifyProofOnChain).not.toHaveBeenCalled();
    expect(InsertNullifierV4).not.toHaveBeenCalled();
  });
});
// #endregion

// #region Downstream error provenance
describe("/api/v4/verify [synthetic downstream errors]", () => {
  it.each([
    "empty-action",
    "thrown-action",
    "check",
    "empty-insert",
    "thrown-insert",
  ])(
    "marks the existing %s error response after recognition",
    async (failure) => {
      const payload = await mint();
      if (failure === "empty-action")
        CreateActionV4.mockResolvedValue({ insert_action_v4_one: null });
      if (failure === "thrown-action")
        CreateActionV4.mockRejectedValue(new Error("unavailable"));
      if (failure === "check")
        CheckNullifierV4.mockRejectedValue(new Error("unavailable"));
      if (failure === "empty-insert")
        InsertNullifierV4.mockResolvedValue({ insert_nullifier_v4_one: null });
      if (failure === "thrown-insert")
        InsertNullifierV4.mockRejectedValue(new Error("unavailable"));
      const response = await verify(payload);
      expect(response.status).toBe(500);
      await expect(response.json()).resolves.toMatchObject({
        test: true,
        code: "internal_error",
      });
      expect(mockVerifyProofOnChain).not.toHaveBeenCalled();
    },
  );
});
// #endregion
