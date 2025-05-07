import { decodeProof, parseProofInputs } from "@/api/helpers/verify";
import { toBeHex } from "ethers";

jest.mock(
  "@/lib/logger",
  () => ({
    logger: {
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    },
  }),
  { virtual: true },
);

describe("verify helpers", () => {
  // Sample ABI-encoded proof
  const encodedProof =
    "0x13046d1af7e62f5b48f0abbd7bf90a0dbbed2eedcde362de280f0582069364ff180406ee4160f3649944d083c809a91f0e352dfcb6d4afba8bb35140c9dfc2171c3e646044e3af21aaf9d5c1674e941b1061e5512b1072f9ab7d880851df425c1c8f7a1d556092d201a7678244fddaef11287edd7aa5ea27e126e457227977b02156fdfc9d31e5b308b9728a9753333bc2c7e560087584fb5efbfae18e901818262f99affb31662d5bc0fdfdd1189bd54c662da2653538d4973c3f042e002ab20ad3756c84904a910c8663e775433923c18ef010843859b71e82af7e1856f14716acf42e25976ba0a7cb86ee58ee2ff8471a6563f540831bbb22d0a373087d1f";

  // Sample pre-decoded proof
  const preDecodedProofArray: [
    [string, string],
    [[string, string], [string, string]],
    [string, string],
  ] = [
    [
      "0x13046d1af7e62f5b48f0abbd7bf90a0dbbed2eedcde362de280f0582069364ff",
      "0x180406ee4160f3649944d083c809a91f0e352dfcb6d4afba8bb35140c9dfc217",
    ],
    [
      [
        "0x1c3e646044e3af21aaf9d5c1674e941b1061e5512b1072f9ab7d880851df425c",
        "0x1c8f7a1d556092d201a7678244fddaef11287edd7aa5ea27e126e457227977b0",
      ],
      [
        "0x2156fdfc9d31e5b308b9728a9753333bc2c7e560087584fb5efbfae18e901818",
        "0x262f99affb31662d5bc0fdfdd1189bd54c662da2653538d4973c3f042e002ab2",
      ],
    ],
    [
      "0x0ad3756c84904a910c8663e775433923c18ef010843859b71e82af7e1856f1471",
      "0x6acf42e25976ba0a7cb86ee58ee2ff8471a6563f540831bbb22d0a373087d1f",
    ],
  ];
  // Convert to JSON string for the new implementation
  const preDecodedProof = JSON.stringify(preDecodedProofArray);

  // Sample pre-decoded proof with numeric values
  const preDecodedProofWithNumbersArray: [
    [string | bigint, string | bigint],
    [[string | number, string | number], [string, string]],
    [string, string],
  ] = [
    [
      "0x13046d1af7e62f5b48f0abbd7bf90a0dbbed2eedcde362de280f0582069364ff",
      123456789n,
    ],
    [
      [
        "0x1c3e646044e3af21aaf9d5c1674e941b1061e5512b1072f9ab7d880851df425c",
        987654321,
      ],
      [
        "0x2156fdfc9d31e5b308b9728a9753333bc2c7e560087584fb5efbfae18e901818",
        "0x262f99affb31662d5bc0fdfdd1189bd54c662da2653538d4973c3f042e002ab2",
      ],
    ],
    [
      "0x0ad3756c84904a910c8663e775433923c18ef010843859b71e82af7e1856f1471",
      "0x6acf42e25976ba0a7cb86ee58ee2ff8471a6563f540831bbb22d0a373087d1f",
    ],
  ];

  // Create a copy of the array with BigInt values converted to strings for JSON serialization
  const preDecodedProofWithNumbersForJSON = [
    [
      preDecodedProofWithNumbersArray[0][0],
      preDecodedProofWithNumbersArray[0][1].toString(),
    ],
    [
      [
        preDecodedProofWithNumbersArray[1][0][0],
        preDecodedProofWithNumbersArray[1][0][1].toString(),
      ],
      [
        preDecodedProofWithNumbersArray[1][1][0],
        preDecodedProofWithNumbersArray[1][1][1],
      ],
    ],
    [
      preDecodedProofWithNumbersArray[2][0],
      preDecodedProofWithNumbersArray[2][1],
    ],
  ];

  // Convert to JSON string for the new implementation
  const preDecodedProofWithNumbers = JSON.stringify(
    preDecodedProofWithNumbersForJSON,
  );

  // Sample invalid pre-decoded proof (wrong structure)
  const invalidPreDecodedProofArray: [string[], string[]] = [
    ["0x123", "0x456"],
    ["0x789", "0xabc"],
  ];
  // Convert to JSON string for the new implementation
  const invalidPreDecodedProof = JSON.stringify(invalidPreDecodedProofArray);

  // Sample escaped JSON string proof (as seen in the real-world example)
  const escapedJsonProof =
    '[[\\"0x928326e69f0a61597e72a4db3e0c7ecc61e6f764ead1e50594115c277e23d80\\",\\"0x3ef48c9c0474288a7aa1e7afdce3267d8f6ff8db3500e5b89938ab1cc9bb5ef\\"],[[\\"0x4028f7fbe6a944e12ac492c2a7c496af1de7219ec29d3e1f42a2c7582030f9d\\",\\"0x11bc3c429886c893e0184aa6c543fe5215ef0e1bf8e7d20f2c8b0cc7a72d2d67\\"],[\\"0xa6542cd3530737433141e440c41b67778499c202b0f4bbe72982564b068aca2\\",\\"0xcb894bb70dfa497afd3b2d5e3f8f315d08f6176bd5f22f272514305a3cce132\\"]],[\\"0x136a78b87198c25c199e30cc376cefce7496e220a9c9595c7280948ffe338712\\",\\"0x2cc881993e95baf68523364203aee8a2b914da346896e043b0f44dffe0f7f425\\"]]';

  describe("decodeProof", () => {
    it("should decode an ABI-encoded proof correctly", () => {
      const result = decodeProof(encodedProof);

      // Verify the structure of the result
      expect(result).toHaveLength(3);
      expect(result[0]).toHaveLength(2);
      expect(result[1]).toHaveLength(2);
      expect(result[1][0]).toHaveLength(2);
      expect(result[1][1]).toHaveLength(2);
      expect(result[2]).toHaveLength(2);

      // Verify all elements are strings
      expect(typeof result[0][0]).toBe("string");
      expect(typeof result[0][1]).toBe("string");
      expect(typeof result[1][0][0]).toBe("string");
      expect(typeof result[1][0][1]).toBe("string");
      expect(typeof result[1][1][0]).toBe("string");
      expect(typeof result[1][1][1]).toBe("string");
      expect(typeof result[2][0]).toBe("string");
      expect(typeof result[2][1]).toBe("string");
    });

    it("should handle a JSON-encoded pre-decoded proof correctly", () => {
      const result = decodeProof(preDecodedProof);

      // Verify the structure of the result
      expect(result).toHaveLength(3);
      expect(result[0]).toHaveLength(2);
      expect(result[1]).toHaveLength(2);
      expect(result[1][0]).toHaveLength(2);
      expect(result[1][1]).toHaveLength(2);
      expect(result[2]).toHaveLength(2);

      // Verify all elements are strings and match the input
      expect(result[0][0]).toBe(preDecodedProofArray[0][0]);
      expect(result[0][1]).toBe(preDecodedProofArray[0][1]);
      expect(result[1][0][0]).toBe(preDecodedProofArray[1][0][0]);
      expect(result[1][0][1]).toBe(preDecodedProofArray[1][0][1]);
      expect(result[1][1][0]).toBe(preDecodedProofArray[1][1][0]);
      expect(result[1][1][1]).toBe(preDecodedProofArray[1][1][1]);
      expect(result[2][0]).toBe(preDecodedProofArray[2][0]);
      expect(result[2][1]).toBe(preDecodedProofArray[2][1]);
    });

    it("should handle escaped JSON string proofs correctly", () => {
      const result = decodeProof(escapedJsonProof);

      // Verify the structure of the result
      expect(result).toHaveLength(3);
      expect(result[0]).toHaveLength(2);
      expect(result[1]).toHaveLength(2);
      expect(result[1][0]).toHaveLength(2);
      expect(result[1][1]).toHaveLength(2);
      expect(result[2]).toHaveLength(2);

      // Verify specific values from the escaped JSON proof
      expect(result[0][0]).toBe(
        "0x928326e69f0a61597e72a4db3e0c7ecc61e6f764ead1e50594115c277e23d80",
      );
      expect(result[0][1]).toBe(
        "0x3ef48c9c0474288a7aa1e7afdce3267d8f6ff8db3500e5b89938ab1cc9bb5ef",
      );
      expect(result[2][0]).toBe(
        "0x136a78b87198c25c199e30cc376cefce7496e220a9c9595c7280948ffe338712",
      );
      expect(result[2][1]).toBe(
        "0x2cc881993e95baf68523364203aee8a2b914da346896e043b0f44dffe0f7f425",
      );
    });

    it("should convert numeric values to hex strings in JSON-encoded pre-decoded proofs", () => {
      const result = decodeProof(preDecodedProofWithNumbers);

      // Verify the structure of the result
      expect(result).toHaveLength(3);

      // Verify numeric values are converted to hex strings
      expect(result[0][0]).toBe(preDecodedProofWithNumbersArray[0][0]);
      expect(result[0][1]).toBe(toBeHex(BigInt("123456789")));
      expect(result[1][0][0]).toBe(preDecodedProofWithNumbersArray[1][0][0]);
      expect(result[1][0][1]).toBe(toBeHex(BigInt("987654321")));
      expect(result[1][1][0]).toBe(preDecodedProofWithNumbersArray[1][1][0]);
      expect(result[1][1][1]).toBe(preDecodedProofWithNumbersArray[1][1][1]);
      expect(result[2][0]).toBe(preDecodedProofWithNumbersArray[2][0]);
      expect(result[2][1]).toBe(preDecodedProofWithNumbersArray[2][1]);
    });

    it("should throw an error for invalid ABI-encoded proofs", () => {
      expect(() => {
        decodeProof("0x123"); // Invalid ABI-encoded proof
      }).toThrow();
    });

    it("should fall back to ABI decoding for invalid JSON-encoded pre-decoded proofs", () => {
      // This should throw because the invalid pre-decoded proof doesn't match the expected structure
      // and it's not a valid ABI-encoded proof either
      expect(() => {
        decodeProof(invalidPreDecodedProof);
      }).toThrow();
    });
  });

  describe("parseProofInputs", () => {
    const validInputParams = {
      merkle_root:
        "0x0936d98c83151035b528d1631df5c3607a740bd296b4c79c627130a96645dcc7",
      signal_hash:
        "0x00c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a4",
      nullifier_hash:
        "0x0447c1b95a5a808a36d3966216404ff4d522f1e66ecddf9c22439393f00cf616",
      external_nullifier:
        "0x1c75ff6366690115808bd58e4c6e3342068088703dffa0a0ee07f55892bb10bd",
      proof: encodedProof,
    };

    it("should parse valid input params with an encoded proof", () => {
      const result = parseProofInputs(validInputParams);

      expect(result.error).toBeUndefined();
      expect(result.params).toBeDefined();
      expect(result.params?.proof).toHaveLength(3);
      expect(result.params?.nullifier_hash).toBeDefined();
      expect(result.params?.merkle_root).toBeDefined();
      expect(result.params?.external_nullifier).toBeDefined();
      expect(result.params?.signal_hash).toBeDefined();
    });

    it("should parse valid input params with a JSON-encoded pre-decoded proof", () => {
      const result = parseProofInputs({
        ...validInputParams,
        proof: preDecodedProof,
      });

      expect(result.error).toBeUndefined();
      expect(result.params).toBeDefined();
      expect(result.params?.proof).toHaveLength(3);
    });

    it("should parse valid input params with an escaped JSON string proof", () => {
      const result = parseProofInputs({
        ...validInputParams,
        proof: escapedJsonProof,
      });

      expect(result.error).toBeUndefined();
      expect(result.params).toBeDefined();
      expect(result.params?.proof).toHaveLength(3);
    });

    it("should return an error for invalid proof", () => {
      const result = parseProofInputs({
        ...validInputParams,
        proof: "invalid-proof",
      });

      expect(result.error).toBeDefined();
      expect(result.error?.attribute).toBe("proof");
      expect(result.params).toBeUndefined();
    });

    it("should return an error for invalid merkle_root", () => {
      const result = parseProofInputs({
        ...validInputParams,
        merkle_root: "invalid-merkle-root",
      });

      expect(result.error).toBeDefined();
      expect(result.error?.attribute).toBe("merkle_root");
      expect(result.params).toBeUndefined();
    });

    it("should return an error for invalid nullifier_hash", () => {
      const result = parseProofInputs({
        ...validInputParams,
        nullifier_hash: "invalid-nullifier-hash",
      });

      expect(result.error).toBeDefined();
      expect(result.error?.attribute).toBe("nullifier_hash");
      expect(result.params).toBeUndefined();
    });

    it("should return an error for invalid external_nullifier", () => {
      const result = parseProofInputs({
        ...validInputParams,
        external_nullifier: "invalid-external-nullifier",
      });

      expect(result.error).toBeDefined();
      expect(result.error?.attribute).toBe("external_nullifier");
      expect(result.params).toBeUndefined();
    });
  });
});
