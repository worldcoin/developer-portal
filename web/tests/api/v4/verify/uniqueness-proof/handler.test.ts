import { handleUniquenessProofVerification } from "@/api/v4/verify/uniqueness-proof/handler";
import {
  FACE_SEQUENCER_STAGING,
  ORB_SEQUENCER,
  ORB_SEQUENCER_STAGING,
} from "@/lib/constants";
import { LegacyVerificationLevel } from "@/lib/idkit";
import { NextRequest } from "next/server";
import { semaphoreProofParamsMock } from "../../../__mocks__/proof.mock";

// #region Mocks
const FetchActionV4 = jest.fn();
const CreateActionV4 = jest.fn();
const CheckNullifierV4 = jest.fn();
const InsertNullifierV4 = jest.fn();

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

jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn() },
}));

jest.mock(
  "@/services/posthogClient",
  () => ({
    captureEvent: jest.fn(),
  }),
  { virtual: true },
);

const verifyProofOnChain = jest.fn();

jest.mock("@/api/helpers/temporal-rpc", () => ({
  verifyProofOnChain: (...args: unknown[]) => verifyProofOnChain(...args),
}));
// #endregion

// #region Test Data
const appId = "app_0123456789abcdef0123456789abcdef";
const rpId = "rp_0123456789abcdef";
const mismatchDetail =
  'This proof was generated for the production environment, but this request uses staging. Set environment to "production" or generate a new staging proof.';

const createSequencerResponse = (
  ok: boolean,
  body: Record<string, unknown>,
) => ({
  ok,
  json: jest.fn().mockResolvedValue(body),
});

const request = new NextRequest("http://localhost/api/v4/verify", {
  method: "POST",
});
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  FetchActionV4.mockResolvedValue({ action_v4: [] });
  CreateActionV4.mockResolvedValue({
    insert_action_v4_one: { id: "action_v4_test", action: "test-action" },
  });
  CheckNullifierV4.mockResolvedValue({ nullifier_v4: [] });
  InsertNullifierV4.mockResolvedValue({
    insert_nullifier_v4_one: { created_at: "2026-01-01T00:00:00.000Z" },
  });
  global.fetch = jest.fn((url: string | URL) => {
    const sequencerUrl = url.toString();

    if (sequencerUrl.startsWith(ORB_SEQUENCER_STAGING)) {
      return Promise.resolve(
        createSequencerResponse(false, { errorId: "invalid_root" }),
      );
    }

    if (sequencerUrl.startsWith(ORB_SEQUENCER)) {
      return Promise.resolve(createSequencerResponse(true, { valid: true }));
    }

    if (sequencerUrl.startsWith(FACE_SEQUENCER_STAGING)) {
      return Promise.resolve(
        createSequencerResponse(false, {
          errorId: "decompressing_proof_error",
        }),
      );
    }

    throw new Error(`Unexpected sequencer URL: ${sequencerUrl}`);
  }) as unknown as typeof fetch;
});

// #region Session-bound ownership
describe("session-bound uniqueness ownership", () => {
  const sessionId = "session_" + "0".repeat(63) + "1" + "01" + "0".repeat(62);
  const params = {
    action: "world_usernames:v2:owner",
    protocol_version: "4.0" as const,
    session_id: sessionId,
    nonce: "0x3",
    responses: [
      {
        identifier: "orb",
        issuer_schema_id: "1",
        nullifier: "0x2",
        expires_at_min: "1772584197",
        signal_hash: "0x4",
        proof: ["0x1", "0x2", "0x3", "0x4", "0x5"] as [
          string,
          string,
          string,
          string,
          string,
        ],
      },
    ],
  };

  beforeEach(() => {
    process.env.VERIFIER_CONTRACT_ADDRESS = "0x" + "11".repeat(20);
  });

  it.each(["new", "existing", "concurrent"])(
    "returns the session only after jointly verifying it (%s nullifier)",
    async (kind) => {
      verifyProofOnChain.mockResolvedValue({ success: true });
      if (kind === "existing") {
        CheckNullifierV4.mockResolvedValue({
          nullifier_v4: [{ created_at: "2026-01-01" }],
        });
      }
      if (kind === "concurrent") {
        InsertNullifierV4.mockRejectedValueOnce(new Error("duplicate key"));
      }
      const response = await handleUniquenessProofVerification(
        {} as never,
        rpId,
        appId,
        params,
        request,
      );
      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({
        session_id: sessionId,
        protocol_version: "4.0",
      });
      expect(verifyProofOnChain).toHaveBeenCalledWith(
        expect.objectContaining({
          nullifier: 2n,
          sessionId: 1n,
          nonce: 3n,
          signalHash: 4n,
          issuerSchemaId: 1n,
        }),
        process.env.VERIFIER_CONTRACT_ADDRESS,
      );
    },
  );

  it("does not consume or return ownership when the joint proof fails", async () => {
    verifyProofOnChain.mockResolvedValue({
      success: false,
      error: { code: "invalid_proof" },
    });
    const response = await handleUniquenessProofVerification(
      {} as never,
      rpId,
      appId,
      params,
      request,
    );
    expect(response.status).toBe(400);
    expect(await response.json()).not.toHaveProperty("session_id");
    expect(InsertNullifierV4).not.toHaveBeenCalled();
  });
});
// #endregion

// #region Environment mismatch response
describe("handleUniquenessProofVerification [environment mismatch]", () => {
  it("returns environment_mismatch at the top level when any v3 proof has the wrong environment", async () => {
    const response = await handleUniquenessProofVerification(
      {} as never,
      rpId,
      appId,
      {
        action: "test-action",
        protocol_version: "3.0",
        environment: "staging",
        responses: [
          {
            identifier: LegacyVerificationLevel.Orb,
            signal_hash: semaphoreProofParamsMock.signal_hash,
            merkle_root: semaphoreProofParamsMock.merkle_root,
            nullifier: semaphoreProofParamsMock.nullifier_hash,
            proof: semaphoreProofParamsMock.proof,
          },
          {
            identifier: LegacyVerificationLevel.Face,
            signal_hash: semaphoreProofParamsMock.signal_hash,
            merkle_root: semaphoreProofParamsMock.merkle_root,
            nullifier: semaphoreProofParamsMock.nullifier_hash,
            proof: semaphoreProofParamsMock.proof,
          },
        ],
      },
      request,
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      code: "environment_mismatch",
      detail: mismatchDetail,
      results: [
        {
          identifier: LegacyVerificationLevel.Orb,
          success: false,
          code: "environment_mismatch",
          detail: mismatchDetail,
          attribute: "environment",
        },
        {
          identifier: LegacyVerificationLevel.Face,
          success: false,
          code: "invalid_proof",
          detail:
            "The provided proof is invalid and it cannot be verified. Please check all inputs and try again.",
        },
      ],
    });
  });
});
// #endregion

// #region Accepted protocol version disclosure
describe("handleUniquenessProofVerification [protocol_version disclosure]", () => {
  it("reports 3.0 on a success reached through the legacy sequencer path", async () => {
    const response = await handleUniquenessProofVerification(
      {} as never,
      rpId,
      appId,
      {
        action: "test-action",
        nonce: "1",
        protocol_version: "3.0",
        responses: [
          {
            identifier: LegacyVerificationLevel.Orb,
            signal_hash: semaphoreProofParamsMock.signal_hash,
            merkle_root: semaphoreProofParamsMock.merkle_root,
            nullifier: semaphoreProofParamsMock.nullifier_hash,
            proof: semaphoreProofParamsMock.proof,
          },
        ],
      },
      request,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      protocol_version: "3.0",
    });
    // The 3.0 path never forwards the nonce, which is exactly why the accepted
    // version has to be disclosed.
    expect(verifyProofOnChain).not.toHaveBeenCalled();
  });

  it("reports 4.0 on a success reached through the on-chain verifier", async () => {
    process.env.VERIFIER_CONTRACT_ADDRESS = "0xverifier";
    verifyProofOnChain.mockResolvedValue({ success: true });

    const response = await handleUniquenessProofVerification(
      {} as never,
      rpId,
      appId,
      {
        action: "test-action",
        nonce: "1",
        protocol_version: "4.0",
        responses: [
          {
            identifier: "credential",
            signal_hash: "0x0",
            issuer_schema_id: "128",
            nullifier: "0x02",
            expires_at_min: "1772584197",
            proof: ["0x1", "0x2", "0x3", "0x4", "0x5"],
          },
        ],
      },
      request,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      protocol_version: "4.0",
    });
    // 4.0 binds the nonce as a circuit public input.
    expect(verifyProofOnChain).toHaveBeenCalledWith(
      expect.objectContaining({ nonce: 1n }),
      "0xverifier",
    );
  });

  it("reports 3.0 when an existing nullifier short-circuits the insert", async () => {
    CheckNullifierV4.mockResolvedValue({
      nullifier_v4: [{ created_at: "2026-01-01T00:00:00.000Z" }],
    });

    const response = await handleUniquenessProofVerification(
      {} as never,
      rpId,
      appId,
      {
        action: "test-action",
        nonce: "1",
        protocol_version: "3.0",
        responses: [
          {
            identifier: LegacyVerificationLevel.Orb,
            signal_hash: semaphoreProofParamsMock.signal_hash,
            merkle_root: semaphoreProofParamsMock.merkle_root,
            nullifier: semaphoreProofParamsMock.nullifier_hash,
            proof: semaphoreProofParamsMock.proof,
          },
        ],
      },
      request,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      protocol_version: "3.0",
    });
    expect(InsertNullifierV4).not.toHaveBeenCalled();
  });
});
// #endregion
