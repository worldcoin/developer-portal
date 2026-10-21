import { POST } from "@/api/v4/verify";
import VERIFIER_ABI from "@/api/helpers/abi/verifier.json";
import { Interface } from "ethers";
import { hashSignal } from "@worldcoin/idkit/hashing";
import { NextRequest } from "next/server";

// #region Mocks: keep schema, routing, and verification handlers real
const FetchRpRegistrationByRpId = jest.fn();
const FetchActionV4 = jest.fn();
const CreateActionV4 = jest.fn();
const CheckNullifierV4 = jest.fn();
const InsertNullifierV4 = jest.fn();
const mockProviderCall = jest.fn();

jest.mock("server-only", () => ({}));

jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
jest.mock("@/api/helpers/graphql", () => ({
  getAPIServiceGraphqlClient: jest.fn().mockResolvedValue({}),
}));
jest.mock("@/api/helpers/graphql/fetch-rp-registration.generated", () => ({
  getSdk: () => ({ FetchRpRegistrationByRpId }),
}));
jest.mock("@/api/v4/verify/graphql/fetch-action-v4.generated", () => ({
  getSdk: () => ({ FetchActionV4 }),
}));
jest.mock("@/api/v4/verify/graphql/create-action-v4.generated", () => ({
  getSdk: () => ({ CreateActionV4 }),
}));
jest.mock("@/api/v4/verify/graphql/check-nullifier-v4.generated", () => ({
  getSdk: () => ({ CheckNullifierV4 }),
}));
jest.mock("@/api/v4/verify/graphql/insert-nullifier-v4.generated", () => ({
  getSdk: () => ({ InsertNullifierV4 }),
}));
jest.mock("ethers", () => ({
  ...jest.requireActual("ethers"),
  JsonRpcProvider: jest.fn().mockImplementation(() => ({
    call: (...args: unknown[]) => mockProviderCall(...args),
  })),
}));
jest.mock("@/services/posthogClient", () => ({ captureEvent: jest.fn() }), {
  virtual: true,
});
// #endregion

// #region Test Data
const appId = "app_0123456789abcdef0123456789abcdef";
const rpId = "rp_0123456789abcdef";
const field = (value: bigint) => value.toString(16).padStart(64, "0");
const sessionId = `session_${field(3n)}01${"00".repeat(31)}`;
const nullifier = `0x${field(2n)}`;
const proof = {
  identifier: "proof_of_human",
  signal_hash: "0x5",
  issuer_schema_id: 1,
  nullifier,
  expires_at_min: 1772584197,
  proof: ["1", "2", "3", "4", "5"],
};
const createdAt = "2026-01-01T00:00:00.000Z";
const verifierInterface = new Interface(VERIFIER_ABI);
const contractCall = () =>
  verifierInterface.parseTransaction(mockProviderCall.mock.calls[0][0])!;

function verify(overrides: Record<string, unknown> = {}) {
  const request = new NextRequest(`http://localhost/api/v4/verify/${rpId}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      protocol_version: "4.0",
      action: "signup",
      session_id: sessionId,
      nonce: "0x1",
      environment: "production",
      responses: [proof],
      ...overrides,
    }),
  });
  return POST(request, { params: Promise.resolve({ app_id: rpId }) });
}
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  process.env.VERIFIER_CONTRACT_ADDRESS =
    "0x0000000000000000000000000000000000000001";
  process.env.TEMPORAL_RPC_URL = "https://rpc.example.test";
  delete process.env.SANDBOX_VERIFY_DIAGNOSTICS_ENABLED;
  FetchRpRegistrationByRpId.mockResolvedValue({
    rp_registration: [
      {
        rp_id: rpId,
        app_id: appId,
        status: "registered",
        app: { status: "active", is_archived: false, deleted_at: null },
      },
    ],
  });
  FetchActionV4.mockReset().mockResolvedValue({ action_v4: [] });
  CreateActionV4.mockReset().mockResolvedValue({
    insert_action_v4_one: { id: "action_signup", action: "signup" },
  });
  CheckNullifierV4.mockReset().mockResolvedValue({ nullifier_v4: [] });
  InsertNullifierV4.mockReset().mockResolvedValue({
    insert_nullifier_v4_one: { created_at: createdAt },
  });
  mockProviderCall.mockReset().mockResolvedValue("0x");
});

// #region Uniqueness with session creation
it("verifies action + session_id with the session commitment and stores the uniqueness nullifier", async () => {
  const response = await verify();
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({
    success: true,
    action: "signup",
    nullifier,
  });
  expect(mockProviderCall).toHaveBeenCalledTimes(1);
  expect(contractCall().name).toBe("verifyProofAndSignals");
  expect(Array.from(contractCall().args)).toEqual([
    2n,
    BigInt(hashSignal("signup")),
    BigInt("0x0123456789abcdef"),
    1n,
    5n,
    1772584197n,
    1n,
    0n,
    3n,
    [1n, 2n, 3n, 4n, 5n],
  ]);
  expect(InsertNullifierV4).toHaveBeenCalledWith({
    action_v4_id: "action_signup",
    nullifier: "2",
  });
});

it("keeps ordinary uniqueness proofs on verify", async () => {
  expect((await verify({ session_id: undefined })).status).toBe(200);
  expect(contractCall().name).toBe("verify");
});

it("keeps session-only proofs on verifySession without uniqueness storage", async () => {
  const { nullifier: _nullifier, ...sessionProof } = proof;
  const response = await verify({
    action: undefined,
    responses: [{ ...sessionProof, session_nullifier: ["2", "3"] }],
  });
  expect(response.status).toBe(200);
  expect(contractCall().name).toBe("verifySession");
  expect(InsertNullifierV4).not.toHaveBeenCalled();
});

it.each([undefined, "signup"])(
  "rejects an empty session_id at validation with action %s",
  async (action) => {
    const response = await verify({ action, session_id: "" });
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      code: "validation_error",
      attribute: "session_id",
      detail: "session_id must not be empty",
    });
    expect(mockProviderCall).not.toHaveBeenCalled();
    expect(CreateActionV4).not.toHaveBeenCalled();
    expect(InsertNullifierV4).not.toHaveBeenCalled();
  },
);

it.each(["invalid", `session_${field(0n)}01${"00".repeat(31)}`])(
  "rejects malformed or zero session commitments before RPC: %s",
  async (session_id) => {
    expect((await verify({ session_id })).status).toBe(400);
    expect(mockProviderCall).not.toHaveBeenCalled();
    expect(InsertNullifierV4).not.toHaveBeenCalled();
  },
);

it("does not retry without the binding or write uniqueness state if the contract rejects the proof", async () => {
  mockProviderCall.mockRejectedValue({ code: "CALL_EXCEPTION", data: "0x" });
  expect((await verify()).status).toBe(400);
  expect(mockProviderCall).toHaveBeenCalledTimes(1);
  expect(contractCall().name).toBe("verifyProofAndSignals");
  expect(CreateActionV4).not.toHaveBeenCalled();
  expect(InsertNullifierV4).not.toHaveBeenCalled();
});
// #endregion
