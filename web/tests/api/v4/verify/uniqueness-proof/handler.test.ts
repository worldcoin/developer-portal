import { handleUniquenessProofVerification } from "@/api/v4/verify/uniqueness-proof/handler";
import { LegacyVerificationLevel } from "@/lib/idkit";
import { NextRequest } from "next/server";

// #region Mocks
const FetchActionV4 = jest.fn();
const mockProcessUniquenessProofV3 = jest.fn();

jest.mock("@/api/v4/verify/graphql/fetch-action-v4.generated", () => ({
  getSdk: () => ({ FetchActionV4 }),
}));

jest.mock("@/api/v4/verify/uniqueness-proof/verify-v3", () => ({
  processUniquenessProofV3: (...args: unknown[]) =>
    mockProcessUniquenessProofV3(...args),
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

const request = new NextRequest("http://localhost/api/v4/verify", {
  method: "POST",
});
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  FetchActionV4.mockResolvedValue({ action_v4: [] });
});

// #region Environment mismatch response
describe("handleUniquenessProofVerification [environment mismatch]", () => {
  it("returns environment_mismatch at the top level when any v3 proof has the wrong environment", async () => {
    mockProcessUniquenessProofV3.mockResolvedValue([
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
        detail: "The provided proof is invalid.",
      },
    ]);

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
            signal_hash: "0x1",
            merkle_root: "0x2",
            nullifier: "0x3",
            proof: "0x4",
          },
          {
            identifier: LegacyVerificationLevel.Face,
            signal_hash: "0x5",
            merkle_root: "0x6",
            nullifier: "0x7",
            proof: "0x8",
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
          detail: "The provided proof is invalid.",
        },
      ],
    });
  });
});
// #endregion
