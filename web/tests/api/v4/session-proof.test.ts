const verifySessionProofOnChain = jest.fn();

jest.mock("@/api/helpers/temporal-rpc", () => ({
  verifySessionProofOnChain: (...args: unknown[]) =>
    verifySessionProofOnChain(...args),
}));

jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock("@worldcoin/idkit-server", () => ({
  getSessionCommitment: (sessionId: string) => {
    if (!/^session_[0-9a-fA-F]{128}$/.test(sessionId)) {
      throw new Error("Invalid session ID");
    }

    return BigInt(`0x${sessionId.slice(8, 72)}`);
  },
}));

import { SessionProofRequest } from "@/api/v4/verify/request-schema";
import {
  getVerifierSessionId,
  processSessionProof,
} from "@/api/v4/verify/session-proof/verify-util";

describe("v4 session proof verification", () => {
  it("extracts the verifier commitment from opaque SDK session ids", () => {
    const commitment = "0".repeat(63) + "1";
    const oprfSeed = "ab".repeat(32);

    expect(getVerifierSessionId(`session_${commitment}${oprfSeed}`)).toBe(1n);
  });

  it("preserves existing numeric session id inputs", () => {
    expect(getVerifierSessionId("123")).toBe(123n);
    expect(getVerifierSessionId("0x7b")).toBe(123n);
  });
});

describe("processSessionProof [issuer binding]", () => {
  const sessionProofRequest = {
    session_id: "123",
    nonce: "1",
    protocol_version: "4.0",
    responses: [
      {
        identifier: "orb",
        signal_hash: "0x0",
        issuer_schema_id: 9310,
        session_nullifier: ["0x1", "0x2"],
        expires_at_min: 1772584197,
        proof: ["0x1", "0x2", "0x3", "0x4", "0x5"],
      },
    ],
  } as unknown as SessionProofRequest;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("echoes the verified issuer schema id on success", async () => {
    verifySessionProofOnChain.mockResolvedValue({ success: true });

    const results = await processSessionProof(
      1n,
      sessionProofRequest,
      "0x0000000000000000000000000000000000000001",
    );

    expect(results[0]).toMatchObject({
      identifier: "orb",
      issuer_schema_id: 9310,
      success: true,
    });
  });

  it("echoes the issuer schema id on a failed verification", async () => {
    verifySessionProofOnChain.mockResolvedValue({
      success: false,
      error: { code: "invalid_proof", detail: "The proof is invalid." },
    });

    const results = await processSessionProof(
      1n,
      sessionProofRequest,
      "0x0000000000000000000000000000000000000001",
    );

    expect(results[0]).toMatchObject({
      issuer_schema_id: 9310,
      success: false,
      code: "invalid_proof",
    });
  });
});
