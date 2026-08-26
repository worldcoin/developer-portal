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

jest.mock("@/api/v4/verify/graphql/fetch-action-v4.generated", () => ({
  getSdk: () => ({ FetchActionV4 }),
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
