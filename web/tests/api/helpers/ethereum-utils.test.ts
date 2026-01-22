import {
  parseDerSignature,
  normalizeSValue,
  bytesToHex,
  extractPublicKeyFromSpki,
  publicKeyToAddress,
} from "@/api/helpers/ethereum-utils";

describe("ethereum-utils", () => {
  describe("parseDerSignature", () => {
    it("should parse a valid DER signature", () => {
      // Example DER signature (simplified)
      // 30 44 02 20 [32 bytes r] 02 20 [32 bytes s]
      const r = new Uint8Array(32).fill(0x11);
      const s = new Uint8Array(32).fill(0x22);

      const der = new Uint8Array([
        0x30,
        0x44, // SEQUENCE, length 68
        0x02,
        0x20, // INTEGER, length 32
        ...r,
        0x02,
        0x20, // INTEGER, length 32
        ...s,
      ]);

      const result = parseDerSignature(der);

      expect(bytesToHex(result.r)).toBe(bytesToHex(r));
      expect(bytesToHex(result.s)).toBe(bytesToHex(s));
    });

    it("should handle r with leading zero (33 bytes)", () => {
      // When r has high bit set, DER adds a leading 0x00
      const rWithoutLeadingZero = new Uint8Array(32);
      rWithoutLeadingZero[0] = 0x80; // High bit set
      rWithoutLeadingZero.fill(0x11, 1);

      const s = new Uint8Array(32).fill(0x22);

      const der = new Uint8Array([
        0x30,
        0x45, // SEQUENCE, length 69
        0x02,
        0x21, // INTEGER, length 33
        0x00, // Leading zero
        ...rWithoutLeadingZero,
        0x02,
        0x20, // INTEGER, length 32
        ...s,
      ]);

      const result = parseDerSignature(der);

      expect(result.r.length).toBe(32);
      expect(result.r[0]).toBe(0x80);
    });

    it("should throw on invalid DER (missing SEQUENCE tag)", () => {
      const invalid = new Uint8Array([0x31, 0x44, 0x02, 0x20]);

      expect(() => parseDerSignature(invalid)).toThrow(
        "Invalid DER signature: missing SEQUENCE tag",
      );
    });
  });

  describe("normalizeSValue", () => {
    it("should not modify S values in the lower half", () => {
      // Small S value
      const s = new Uint8Array(32);
      s[31] = 0x01;

      const result = normalizeSValue(s);

      expect(bytesToHex(result)).toBe(bytesToHex(s));
    });

    it("should normalize S values in the upper half", () => {
      // S = secp256k1_n - 1 (definitely in upper half)
      // secp256k1_n = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141
      const highS = new Uint8Array([
        0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
        0xff, 0xff, 0xff, 0xfe, 0xba, 0xae, 0xdc, 0xe6, 0xaf, 0x48, 0xa0, 0x3b,
        0xbf, 0xd2, 0x5e, 0x8c, 0xd0, 0x36, 0x41, 0x40,
      ]);

      const result = normalizeSValue(highS);

      // Result should be n - highS = 1
      expect(result[31]).toBe(0x01);
      // All other bytes should be 0
      for (let i = 0; i < 31; i++) {
        expect(result[i]).toBe(0);
      }
    });
  });

  describe("bytesToHex", () => {
    it("should convert bytes to hex string", () => {
      const bytes = new Uint8Array([0x00, 0x01, 0x0a, 0xff]);
      expect(bytesToHex(bytes)).toBe("0x00010aff");
    });

    it("should handle empty array", () => {
      expect(bytesToHex(new Uint8Array([]))).toBe("0x");
    });
  });

  describe("extractPublicKeyFromSpki", () => {
    it("should extract uncompressed public key from SPKI", () => {
      // Create a mock SPKI key with 26-byte header + 65-byte uncompressed key
      const header = new Uint8Array(26).fill(0x00);
      const uncompressedKey = new Uint8Array(65);
      uncompressedKey[0] = 0x04; // Uncompressed marker
      uncompressedKey.fill(0x11, 1, 33); // x coordinate
      uncompressedKey.fill(0x22, 33, 65); // y coordinate

      const spki = new Uint8Array([...header, ...uncompressedKey]);

      const result = extractPublicKeyFromSpki(spki);

      expect(result.length).toBe(65);
      expect(result[0]).toBe(0x04);
    });

    it("should throw if public key is not uncompressed", () => {
      const header = new Uint8Array(26).fill(0x00);
      const compressedKey = new Uint8Array(65);
      compressedKey[0] = 0x02; // Compressed marker (wrong)

      const spki = new Uint8Array([...header, ...compressedKey]);

      expect(() => extractPublicKeyFromSpki(spki)).toThrow(
        "Invalid public key: expected uncompressed format",
      );
    });
  });

  describe("publicKeyToAddress", () => {
    it("should derive correct Ethereum address from public key", () => {
      // Known test vector: secp256k1 generator point G
      // Public key (uncompressed): 04 + x + y coordinates of G
      const generatorPointX = new Uint8Array([
        0x79, 0xbe, 0x66, 0x7e, 0xf9, 0xdc, 0xbb, 0xac, 0x55, 0xa0, 0x62, 0x95,
        0xce, 0x87, 0x0b, 0x07, 0x02, 0x9b, 0xfc, 0xdb, 0x2d, 0xce, 0x28, 0xd9,
        0x59, 0xf2, 0x81, 0x5b, 0x16, 0xf8, 0x17, 0x98,
      ]);
      const generatorPointY = new Uint8Array([
        0x48, 0x3a, 0xda, 0x77, 0x26, 0xa3, 0xc4, 0x65, 0x5d, 0xa4, 0xfb, 0xfc,
        0x0e, 0x11, 0x08, 0xa8, 0xfd, 0x17, 0xb4, 0x48, 0xa6, 0x85, 0x54, 0x19,
        0x9c, 0x47, 0xd0, 0x8f, 0xfb, 0x10, 0xd4, 0xb8,
      ]);

      const publicKey = new Uint8Array([
        0x04,
        ...generatorPointX,
        ...generatorPointY,
      ]);

      const address = publicKeyToAddress(publicKey);

      // Known address for generator point G
      expect(address.toLowerCase()).toBe(
        "0x7e5f4552091a69125d5dfcb7b8c2659029395bdf",
      );
    });

    it("should throw for invalid public key length", () => {
      const invalidKey = new Uint8Array(64);

      expect(() => publicKeyToAddress(invalidKey)).toThrow(
        "Invalid public key",
      );
    });

    it("should throw for compressed public key", () => {
      const compressedKey = new Uint8Array(65);
      compressedKey[0] = 0x02;

      expect(() => publicKeyToAddress(compressedKey)).toThrow(
        "Invalid public key",
      );
    });
  });
});
