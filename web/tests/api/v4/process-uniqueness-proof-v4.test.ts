import { processUniquenessProofV4 } from "@/api/v4/verify/uniqueness-proof/verify-v4";

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
const baseItem = {
  // `identifier` is a caller-supplied passthrough label — not bound to the proof.
  identifier: "orb",
  signal_hash: "0x0",
  // `issuer_schema_id` is the credential type the proof is verified against.
  issuer_schema_id: "7",
  nullifier: "0x2",
  expires_at_min: 1772584197,
  proof: ["0x1", "0x2", "0x3", "0x4", "0x5"],
};

const run = (item: Record<string, unknown>) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  processUniquenessProofV4(1n, "1", "verify", [item as any], "0xverifier");
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
});

// #region issuer_schema_id binding (#3751156)
describe("processUniquenessProofV4 [verified credential type]", () => {
  it("surfaces the verified issuer_schema_id on success, alongside the echoed identifier", async () => {
    verifyProofOnChain.mockResolvedValue({ success: true });

    const [result] = await run(baseItem);

    expect(result).toMatchObject({
      success: true,
      // passthrough label preserved for backwards compatibility...
      identifier: "orb",
      // ...but the verified credential type is now surfaced so relying parties
      // can authorize on it rather than on the caller-controlled identifier.
      issuer_schema_id: "7",
      nullifier: "0x2",
    });
  });

  it("does not surface issuer_schema_id when verification fails", async () => {
    verifyProofOnChain.mockResolvedValue({
      success: false,
      error: { code: "invalid_proof", detail: "nope" },
    });

    const [result] = await run(baseItem);

    expect(result.success).toBe(false);
    expect(result.issuer_schema_id).toBeUndefined();
  });
});
// #endregion
