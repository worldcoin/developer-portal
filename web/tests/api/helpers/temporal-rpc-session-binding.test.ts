import { verifyProofOnChain } from "@/api/helpers/temporal-rpc";

// #region RPC boundary
const verify = jest.fn();
const verifyProofAndSignals = jest.fn();
jest.mock("server-only", () => ({}));
jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
jest.mock("ethers", () => ({
  ...jest.requireActual("ethers"),
  JsonRpcProvider: jest.fn(),
  Contract: jest.fn(() => ({ verify, verifyProofAndSignals })),
}));
// #endregion

const proof = [1n, 2n, 3n, 4n, 5n] as [bigint, bigint, bigint, bigint, bigint];
const params = {
  nullifier: 10n,
  action: 20n,
  rpId: 30n,
  nonce: 40n,
  signalHash: 50n,
  expiresAtMin: 60n,
  issuerSchemaId: 1n,
  credentialGenesisIssuedAtMin: 0n,
  zeroKnowledgeProof: proof,
};

beforeEach(() => {
  jest.clearAllMocks();
  process.env.TEMPORAL_RPC_URL = "https://rpc.example.test";
});

describe("on-chain session binding", () => {
  it("verifies ownership and session in the same circuit", async () => {
    expect(
      await verifyProofOnChain(
        { ...params, sessionId: 70n },
        "0x" + "11".repeat(20),
      ),
    ).toEqual({ success: true });
    expect(verifyProofAndSignals).toHaveBeenCalledWith(
      10n,
      20n,
      30n,
      40n,
      50n,
      60n,
      1n,
      0n,
      70n,
      proof,
    );
    expect(verify).not.toHaveBeenCalled();
  });

  it("preserves the ordinary uniqueness verification path", async () => {
    await verifyProofOnChain(params, "0x" + "11".repeat(20));
    expect(verify).toHaveBeenCalledWith(
      10n,
      20n,
      30n,
      40n,
      50n,
      60n,
      1n,
      0n,
      proof,
    );
    expect(verifyProofAndSignals).not.toHaveBeenCalled();
  });

  it("rejects a zero commitment without falling back to ordinary uniqueness", async () => {
    expect(
      await verifyProofOnChain(
        { ...params, sessionId: 0n },
        "0x" + "11".repeat(20),
      ),
    ).toMatchObject({ success: false });
    expect(verify).not.toHaveBeenCalled();
    expect(verifyProofAndSignals).not.toHaveBeenCalled();
  });

  it("does not downgrade when the joint verifier rejects the proof", async () => {
    verifyProofAndSignals.mockRejectedValueOnce({
      revert: { name: "ProofInvalid" },
    });
    expect(
      await verifyProofOnChain(
        { ...params, sessionId: 70n },
        "0x" + "11".repeat(20),
      ),
    ).toMatchObject({ success: false, error: { code: "invalid_proof" } });
    expect(verify).not.toHaveBeenCalled();
  });
});
