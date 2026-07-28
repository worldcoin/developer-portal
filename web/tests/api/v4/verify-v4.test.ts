import { processUniquenessProofV4 } from "@/api/v4/verify/uniqueness-proof/verify-v4";

const mockVerifyProofOnChain = jest.fn();

jest.mock("@/api/helpers/temporal-rpc", () => ({
  verifyProofOnChain: (...args: unknown[]) => mockVerifyProofOnChain(...args),
}));

jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

describe("v4 uniqueness-proof verification", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVerifyProofOnChain.mockResolvedValue({ success: true });
  });

  it('verifies a "selfie" response by schema ID without translating its identifier', async () => {
    const result = await processUniquenessProofV4(
      1n,
      "2",
      "test-action",
      [
        {
          identifier: "selfie",
          signal_hash: "0x0",
          issuer_schema_id: "11",
          nullifier: "0x3",
          expires_at_min: "1772584197",
          proof: ["0x1", "0x2", "0x3", "0x4", "0x5"],
        },
      ],
      "0x0000000000000000000000000000000000000001",
    );

    const verifierInput = mockVerifyProofOnChain.mock.calls[0]?.[0];
    expect(verifierInput).toEqual(
      expect.objectContaining({
        issuerSchemaId: 11n,
        nullifier: 3n,
      }),
    );
    expect(verifierInput).not.toHaveProperty("identifier");
    expect(result).toEqual([
      {
        identifier: "selfie",
        success: true,
        nullifier: "0x3",
      },
    ]);
  });
});
