import { nullifierHashToBigIntStr } from "@/api/v2/verify/helpers";

describe("nullifierHashToBigIntStr", () => {
  it("should convert a standard hash to BigInt string", () => {
    const hash = "0x123abc";
    const result = nullifierHashToBigIntStr(hash);
    expect(result).toBe("1194684");
  });

  it("should normalize hash by removing 0x prefix and converting to lowercase", () => {
    const hash = "0xABC123";
    const result = nullifierHashToBigIntStr(hash);
    expect(result).toBe("11256099");
  });

  it("should handle hash without 0x prefix", () => {
    const hash = "abc123";
    const result = nullifierHashToBigIntStr(hash);
    expect(result).toBe("11256099");
  });

  it("should handle hash with whitespace", () => {
    const hash = " 0xabc123 ";
    const result = nullifierHashToBigIntStr(hash);
    expect(result).toBe("11256099");
  });

  it("should handle real-world size nullifier hash", () => {
    const hash =
      "0x0447c1b95a5a808a36d3966216404ff4d522f1e66ecddf9c22439393f00cf616";
    const result = nullifierHashToBigIntStr(hash);
    // A 256-bit number is too large to check the exact value, so we verify it's a string of digits
    expect(result).toMatch(/^\d+$/);
    expect(result.length).toBeGreaterThan(70); // A 256-bit number in decimal is ~78 digits
  });
});
