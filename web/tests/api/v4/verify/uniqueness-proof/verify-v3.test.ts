import { verifyProof } from "@/api/helpers/verify";
import { processUniquenessProofV3 } from "@/api/v4/verify/uniqueness-proof/verify-v3";
import { LegacyVerificationLevel } from "@/lib/idkit";

// #region Mocks
jest.mock("@/api/helpers/verify", () => ({
  verifyProof: jest.fn(),
}));

jest.mock("@/lib/logger", () => ({
  logger: { error: jest.fn() },
}));
// #endregion

// #region Test Data
const appId = "app_0123456789abcdef0123456789abcdef";
const action = "test-action";
const response = {
  identifier: LegacyVerificationLevel.Orb,
  signal_hash: "0x1",
  merkle_root: "0x2",
  nullifier: "0x3",
  proof: "0x4",
};

const mockVerifyProof = verifyProof as jest.MockedFunction<typeof verifyProof>;
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
});

// #region Environment mismatch detection
describe("processUniquenessProofV3 [environment mismatch]", () => {
  it("enables mismatch detection for staging verification", async () => {
    mockVerifyProof.mockResolvedValue({
      error: {
        code: "environment_mismatch",
        message: "Use environment=production.",
        statusCode: 400,
        attribute: "environment",
      },
    });

    const results = await processUniquenessProofV3(
      appId,
      action,
      [response],
      true,
    );

    expect(mockVerifyProof).toHaveBeenCalledWith(
      expect.objectContaining({ merkle_root: response.merkle_root }),
      expect.objectContaining({
        is_staging: true,
        detect_environment_mismatch: true,
      }),
    );
    expect(results).toEqual([
      {
        identifier: LegacyVerificationLevel.Orb,
        success: false,
        code: "environment_mismatch",
        detail: "Use environment=production.",
        attribute: "environment",
      },
    ]);
  });
});
// #endregion
