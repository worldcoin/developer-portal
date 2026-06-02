jest.mock("@worldcoin/idkit-server", () => ({
  getSessionCommitment: (sessionId: string) => {
    if (!/^session_[0-9a-fA-F]{128}$/.test(sessionId)) {
      throw new Error("Invalid session ID");
    }

    return BigInt(`0x${sessionId.slice(8, 72)}`);
  },
}));

import { getVerifierSessionId } from "@/api/v4/verify/session-proof/verify-util";

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
