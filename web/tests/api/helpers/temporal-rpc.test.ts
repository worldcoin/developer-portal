import {
  VerifyProofParams,
  verifyProofOnChain,
  verifySessionProofOnChain,
} from "@/api/helpers/temporal-rpc";
import VERIFIER_ABI from "@/api/helpers/abi/verifier.json";
import { logger } from "@/lib/logger";
import { Interface } from "ethers";

// #region Mocks
const mockProviderCall = jest.fn();

jest.mock("server-only", () => ({}));
jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
jest.mock("ethers", () => ({
  ...jest.requireActual("ethers"),
  // Keep the real Contract and ABI encoder/decoder; mock only external RPC.
  JsonRpcProvider: jest.fn().mockImplementation(() => ({
    call: (...args: unknown[]) => mockProviderCall(...args),
  })),
}));
// #endregion

// #region Test Data
const verifierAddress = "0x0000000000000000000000000000000000000001";
const verifierInterface = new Interface(VERIFIER_ABI);
const scalarField =
  21888242871839275222246405745257275088548364400416034343698204186575808495617n;
const sessionCommitment = 19n;
const params: VerifyProofParams = {
  // The action namespace restriction does not apply to the nullifier output.
  nullifier: scalarField - 1n,
  action: (1n << 248n) - 1n,
  rpId: 3n,
  nonce: 4n,
  signalHash: 5n,
  expiresAtMin: 6n,
  issuerSchemaId: 7n,
  credentialGenesisIssuedAtMin: 8n,
  zeroKnowledgeProof: [9n, 10n, 11n, 12n, 13n],
};
const commonArguments = [
  params.nullifier,
  params.action,
  params.rpId,
  params.nonce,
  params.signalHash,
  params.expiresAtMin,
  params.issuerSchemaId,
  params.credentialGenesisIssuedAtMin,
];
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  mockProviderCall.mockReset();
  mockProviderCall.mockResolvedValue("0x");
  process.env.TEMPORAL_RPC_URL = "https://rpc.example.test";
});

// #region Uniqueness verification dispatch and public inputs
describe("verifyProofOnChain", () => {
  it("preserves the ordinary uniqueness entry point when no session is requested", async () => {
    expect(await verifyProofOnChain(params, verifierAddress)).toEqual({
      success: true,
    });
    expect(mockProviderCall).toHaveBeenCalledTimes(1);
    expect(mockProviderCall).toHaveBeenCalledWith({
      to: verifierAddress,
      data: verifierInterface.encodeFunctionData("verify", [
        ...commonArguments,
        params.zeroKnowledgeProof,
      ]),
    });
  });

  it("passes the uniqueness inputs and nonzero commitment to the deployed generic entry point", async () => {
    expect(
      await verifyProofOnChain(
        { ...params, sessionCommitment },
        verifierAddress,
      ),
    ).toEqual({ success: true });
    expect(mockProviderCall).toHaveBeenCalledTimes(1);
    const transaction = mockProviderCall.mock.calls[0][0];
    expect(transaction.to).toBe(verifierAddress);
    expect(transaction.data.slice(0, 10)).toBe("0xdef1c2c6");
    expect(
      Array.from(
        verifierInterface.decodeFunctionData(
          "verifyProofAndSignals",
          transaction.data,
        ),
      ),
    ).toEqual([
      ...commonArguments,
      sessionCommitment,
      params.zeroKnowledgeProof,
    ]);
  });

  it.each([0n, -1n, scalarField])(
    "rejects invalid commitment %s without falling back to unbound verification",
    async (commitment) => {
      const result = await verifyProofOnChain(
        { ...params, sessionCommitment: commitment },
        verifierAddress,
      );
      expect(result).toMatchObject({
        success: false,
        error: { code: "invalid_public_input" },
      });
      expect(mockProviderCall).not.toHaveBeenCalled();
    },
  );

  it.each([-1n, 1n << 248n])(
    "rejects an action outside the uniqueness namespace before generic verification",
    async (action) => {
      const result = await verifyProofOnChain(
        { ...params, action, sessionCommitment },
        verifierAddress,
      );
      expect(result).toMatchObject({
        success: false,
        error: { code: "invalid_action" },
      });
      expect(mockProviderCall).not.toHaveBeenCalled();
    },
  );

  it.each([
    ["ProofInvalid", "invalid_proof"],
    ["PublicInputNotInField", "invalid_public_input"],
  ])(
    "decodes %s from the generic verifier without retrying as unbound",
    async (name, code) => {
      mockProviderCall.mockRejectedValue({
        code: "CALL_EXCEPTION",
        data: verifierInterface.encodeErrorResult(name),
      });
      const result = await verifyProofOnChain(
        { ...params, sessionCommitment },
        verifierAddress,
      );
      expect(result).toMatchObject({ success: false, error: { code } });
      expect(mockProviderCall).toHaveBeenCalledTimes(1);
      expect(logger.warn).toHaveBeenCalled();
      expect(logger.error).not.toHaveBeenCalled();
    },
  );

  it("fails closed if the generic entry point is unavailable", async () => {
    mockProviderCall.mockRejectedValue({
      code: "CALL_EXCEPTION",
      data: "0x",
    });
    const result = await verifyProofOnChain(
      { ...params, sessionCommitment },
      verifierAddress,
    );
    expect(result).toMatchObject({
      success: false,
      error: { code: "verification_failed" },
    });
    expect(mockProviderCall).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalled();
  });
});
// #endregion

// #region Existing session verification
describe("verifySessionProofOnChain", () => {
  it("retains the session entry point and session-nullifier inputs", async () => {
    const sessionNullifier: [bigint, bigint] = [17n, (2n << 248n) + 18n];
    expect(
      await verifySessionProofOnChain(
        { ...params, sessionId: sessionCommitment, sessionNullifier },
        verifierAddress,
      ),
    ).toEqual({ success: true });
    expect(mockProviderCall).toHaveBeenCalledTimes(1);
    expect(mockProviderCall).toHaveBeenCalledWith({
      to: verifierAddress,
      data: verifierInterface.encodeFunctionData("verifySession", [
        params.rpId,
        params.nonce,
        params.signalHash,
        params.expiresAtMin,
        params.issuerSchemaId,
        params.credentialGenesisIssuedAtMin,
        sessionCommitment,
        sessionNullifier,
        params.zeroKnowledgeProof,
      ]),
    });
  });
});
// #endregion
