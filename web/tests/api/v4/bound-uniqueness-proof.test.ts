import { POST } from "@/api/v4/verify";
import { logger } from "@/lib/logger";
import { hashSignal } from "@worldcoin/idkit/hashing";
import { NextRequest } from "next/server";

// #region Mocks: keep schema, routing, and verification handlers real
const FetchRpRegistrationByRpId = jest.fn();
const FetchActionV4 = jest.fn();
const CreateActionV4 = jest.fn();
const CheckNullifierV4 = jest.fn();
const InsertNullifierV4 = jest.fn();
const verifyProofOnChain = jest.fn();
const verifySessionProofOnChain = jest.fn();

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
jest.mock("@/api/helpers/temporal-rpc", () => ({
  verifyProofOnChain: (...args: unknown[]) => verifyProofOnChain(...args),
  verifySessionProofOnChain: (...args: unknown[]) =>
    verifySessionProofOnChain(...args),
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
const otherSessionId = `session_${field(4n)}01${"00".repeat(31)}`;
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
  process.env.VERIFIER_CONTRACT_ADDRESS = "0xproduction";
  process.env.VERIFIER_CONTRACT_ADDRESS_STAGING = "0xstaging";
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
  verifyProofOnChain.mockReset().mockResolvedValue({ success: true });
  verifySessionProofOnChain.mockReset().mockResolvedValue({ success: true });
});

// #region Bound uniqueness through the real endpoint and handlers
describe("/api/v4/verify [uniqueness with session creation]", () => {
  it.each(["production", "sandbox"])(
    "verifies the binding and preserves uniqueness storage in %s",
    async (environment) => {
      process.env.SANDBOX_VERIFY_DIAGNOSTICS_ENABLED = "true";
      const response = await verify({ environment });
      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({
        success: true,
        protocol_version: "4.0",
        action: "signup",
        session_id: sessionId,
        nullifier,
        environment,
        results: [{ success: true, nullifier }],
      });
      expect(verifyProofOnChain).toHaveBeenCalledWith(
        {
          nullifier: 2n,
          action: BigInt(hashSignal("signup")),
          rpId: BigInt("0x0123456789abcdef"),
          nonce: 1n,
          signalHash: 5n,
          expiresAtMin: 1772584197n,
          issuerSchemaId: 1n,
          credentialGenesisIssuedAtMin: 0n,
          sessionCommitment: 3n,
          zeroKnowledgeProof: [1n, 2n, 3n, 4n, 5n],
        },
        environment === "production" ? "0xproduction" : "0xstaging",
      );
      expect(verifySessionProofOnChain).not.toHaveBeenCalled();
      expect(CheckNullifierV4).toHaveBeenCalledWith({ nullifier: "2" });
      expect(InsertNullifierV4).toHaveBeenCalledWith({
        action_v4_id: "action_signup",
        nullifier: "2",
      });
      if (environment === "sandbox") {
        expect(logger.info).toHaveBeenCalledWith(
          "Sandbox verification diagnostic",
          expect.objectContaining({
            request: expect.objectContaining({ session_proof: false }),
          }),
        );
      }
    },
  );

  it("returns the newly verified session while reusing the existing uniqueness nullifier", async () => {
    FetchActionV4.mockResolvedValue({
      action_v4: [{ id: "action_signup", action: "signup" }],
    });
    CheckNullifierV4.mockResolvedValue({
      nullifier_v4: [{ created_at: createdAt }],
    });
    const response = await verify({ session_id: otherSessionId });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      session_id: otherSessionId,
      nullifier,
      action: "signup",
      created_at: createdAt,
    });
    expect(verifyProofOnChain).toHaveBeenCalledWith(
      expect.objectContaining({ sessionCommitment: 4n, nullifier: 2n }),
      "0xproduction",
    );
    expect(CreateActionV4).not.toHaveBeenCalled();
    expect(InsertNullifierV4).not.toHaveBeenCalled();
  });

  it("retains the verified binding on the duplicate-insert race path", async () => {
    InsertNullifierV4.mockRejectedValue(new Error("duplicate key value"));
    const response = await verify();
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      success: true,
      session_id: sessionId,
      nullifier,
    });
  });

  it("does not create an action or save a nullifier when the bound proof is invalid", async () => {
    verifyProofOnChain.mockResolvedValue({
      success: false,
      error: { code: "invalid_proof", detail: "Proof invalid" },
    });
    const response = await verify();
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toMatchObject({
      success: false,
      code: "all_verifications_failed",
    });
    expect(body).not.toHaveProperty("session_id");
    expect(CreateActionV4).not.toHaveBeenCalled();
    expect(CheckNullifierV4).not.toHaveBeenCalled();
    expect(InsertNullifierV4).not.toHaveBeenCalled();
  });

  it("keeps ordinary uniqueness requests unbound", async () => {
    const response = await verify({ session_id: undefined });
    expect(response.status).toBe(200);
    expect(await response.json()).not.toHaveProperty("session_id");
    expect(verifyProofOnChain.mock.calls[0][0]).not.toHaveProperty(
      "sessionCommitment",
    );
    expect(verifySessionProofOnChain).not.toHaveBeenCalled();
  });

  it("keeps session-only proofs on the session verifier without uniqueness storage", async () => {
    const { nullifier: _nullifier, ...sessionProof } = proof;
    const response = await verify({
      action: undefined,
      responses: [{ ...sessionProof, session_nullifier: ["2", "3"] }],
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      success: true,
      session_id: sessionId,
    });
    expect(verifySessionProofOnChain).toHaveBeenCalledWith(
      expect.objectContaining({ sessionId: 3n, sessionNullifier: [2n, 3n] }),
      "0xproduction",
    );
    expect(verifyProofOnChain).not.toHaveBeenCalled();
    expect(FetchActionV4).not.toHaveBeenCalled();
    expect(InsertNullifierV4).not.toHaveBeenCalled();
  });

  it("still rejects an invalid integrity bundle before bound proof verification", async () => {
    const response = await verify({
      integrity_bundle: {
        version: 2,
        signature_format: "apple_app_attest",
        timestamp: Math.floor(Date.now() / 1000),
        signature: "abcd",
        jwt: "invalid.jwt.token",
      },
    });
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({
      code: "integrity_verification_failed",
    });
    expect(verifyProofOnChain).not.toHaveBeenCalled();
    expect(InsertNullifierV4).not.toHaveBeenCalled();
  });

  it("still requires v2 integrity for a Self Check bound uniqueness proof", async () => {
    const response = await verify({
      responses: [
        {
          ...proof,
          identifier: "selfie",
          issuer_schema_id: 11,
          sybil_score: 10,
        },
      ],
    });
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({
      code: "integrity_verification_failed",
    });
    expect(verifyProofOnChain).not.toHaveBeenCalled();
    expect(InsertNullifierV4).not.toHaveBeenCalled();
  });
});
// #endregion
