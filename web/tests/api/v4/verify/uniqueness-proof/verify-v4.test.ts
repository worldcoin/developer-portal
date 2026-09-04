import { processUniquenessProofV4 } from "@/api/v4/verify/uniqueness-proof/verify-v4";
import { UniquenessProofResponseV4 } from "@/api/v4/verify/request-schema";

// #region Mocks
const verifyProofOnChain = jest.fn();

jest.mock("@/api/helpers/temporal-rpc", () => ({
  verifyProofOnChain: (...args: unknown[]) => verifyProofOnChain(...args),
}));

jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
// #endregion

// #region Test Data
const verifierAddress = "0x0000000000000000000000000000000000000001";

const makeResponse = (
  overrides: Partial<UniquenessProofResponseV4> = {},
): UniquenessProofResponseV4 =>
  ({
    identifier: "orb",
    signal_hash: "0x0",
    issuer_schema_id: 1,
    nullifier: "0x2",
    expires_at_min: 1772584197,
    proof: ["0x1", "0x2", "0x3", "0x4", "0x5"],
    ...overrides,
  }) as unknown as UniquenessProofResponseV4;
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
});

// #region Issuer echo
describe("processUniquenessProofV4 [issuer binding]", () => {
  it("echoes the verified issuer schema id on success", async () => {
    verifyProofOnChain.mockResolvedValue({ success: true });

    const results = await processUniquenessProofV4(
      1n,
      "1",
      "verify",
      [makeResponse({ issuer_schema_id: 9303 as unknown as string })],
      verifierAddress,
    );

    expect(results[0]).toMatchObject({
      identifier: "orb",
      issuer_schema_id: 9303,
      success: true,
    });
    expect(verifyProofOnChain).toHaveBeenCalledWith(
      expect.objectContaining({ issuerSchemaId: 9303n }),
      verifierAddress,
    );
  });

  it("echoes the issuer schema id on a failed verification", async () => {
    verifyProofOnChain.mockResolvedValue({
      success: false,
      error: { code: "invalid_proof", detail: "The proof is invalid." },
    });

    const results = await processUniquenessProofV4(
      1n,
      "1",
      "verify",
      [makeResponse()],
      verifierAddress,
    );

    expect(results[0]).toMatchObject({
      issuer_schema_id: 1,
      success: false,
      code: "invalid_proof",
    });
  });

  it("echoes the issuer schema id when the item cannot be processed", async () => {
    verifyProofOnChain.mockResolvedValue({ success: true });

    const results = await processUniquenessProofV4(
      1n,
      "1",
      "verify",
      [makeResponse({ nullifier: "not-a-number" })],
      verifierAddress,
    );

    expect(results[0]).toMatchObject({
      issuer_schema_id: 1,
      success: false,
      code: "verification_error",
    });
    expect(verifyProofOnChain).not.toHaveBeenCalled();
  });
});
// #endregion
