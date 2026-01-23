import { createManagerKey, signEthDigestWithKms } from "@/api/helpers/kms-eth";
import { KMSClient } from "@aws-sdk/client-kms";
import { getBytes, keccak256, recoverAddress, Signature, Wallet } from "ethers";

jest.mock("@aws-sdk/client-kms", () => ({
  KMSClient: jest.fn().mockImplementation(() => ({ send: jest.fn() })),
  CreateKeyCommand: jest.fn(),
  GetPublicKeyCommand: jest.fn(),
  SignCommand: jest.fn(),
}));

jest.mock("@/lib/logger", () => ({ logger: { error: jest.fn() } }));

// ============================================================================
// Test Vectors
// ============================================================================

// secp256k1 generator point G in SPKI format - known test vector
const SPKI_PUBLIC_KEY = new Uint8Array([
  0x30, 0x56, 0x30, 0x10, 0x06, 0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02, 0x01,
  0x06, 0x05, 0x2b, 0x81, 0x04, 0x00, 0x0a, 0x03, 0x42, 0x00, 0x04, 0x79, 0xbe,
  0x66, 0x7e, 0xf9, 0xdc, 0xbb, 0xac, 0x55, 0xa0, 0x62, 0x95, 0xce, 0x87, 0x0b,
  0x07, 0x02, 0x9b, 0xfc, 0xdb, 0x2d, 0xce, 0x28, 0xd9, 0x59, 0xf2, 0x81, 0x5b,
  0x16, 0xf8, 0x17, 0x98, 0x48, 0x3a, 0xda, 0x77, 0x26, 0xa3, 0xc4, 0x65, 0x5d,
  0xa4, 0xfb, 0xfc, 0x0e, 0x11, 0x08, 0xa8, 0xfd, 0x17, 0xb4, 0x48, 0xa6, 0x85,
  0x54, 0x19, 0x9c, 0x47, 0xd0, 0x8f, 0xfb, 0x10, 0xd4, 0xb8,
]);
const EXPECTED_ADDRESS_FOR_GENERATOR = "0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf";

// Test wallet for signature verification tests
// Private key: 0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
const TEST_PRIVATE_KEY =
  "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

// ============================================================================
// Helpers
// ============================================================================

/**
 * Creates an SPKI-formatted public key from an uncompressed public key.
 */
function createSpkiPublicKey(uncompressedKey: Uint8Array): Uint8Array {
  // SPKI header for secp256k1
  const header = new Uint8Array([
    0x30, 0x56, 0x30, 0x10, 0x06, 0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02,
    0x01, 0x06, 0x05, 0x2b, 0x81, 0x04, 0x00, 0x0a, 0x03, 0x42, 0x00,
  ]);
  const result = new Uint8Array(header.length + uncompressedKey.length);
  result.set(header);
  result.set(uncompressedKey, header.length);
  return result;
}

/**
 * Converts an ethers Signature to DER format (what KMS returns).
 */
function signatureToDer(sig: Signature): Uint8Array {
  const r = getBytes(sig.r);
  const s = getBytes(sig.s);

  // DER integers need leading 0x00 if high bit is set
  const rNeedsPadding = r[0] >= 0x80;
  const sNeedsPadding = s[0] >= 0x80;

  const rLen = r.length + (rNeedsPadding ? 1 : 0);
  const sLen = s.length + (sNeedsPadding ? 1 : 0);
  const totalLen = 4 + rLen + sLen; // 2 bytes for each INTEGER tag+length

  const der = new Uint8Array(2 + totalLen);
  let offset = 0;

  // SEQUENCE
  der[offset++] = 0x30;
  der[offset++] = totalLen;

  // INTEGER r
  der[offset++] = 0x02;
  der[offset++] = rLen;
  if (rNeedsPadding) der[offset++] = 0x00;
  der.set(r, offset);
  offset += r.length;

  // INTEGER s
  der[offset++] = 0x02;
  der[offset++] = sLen;
  if (sNeedsPadding) der[offset++] = 0x00;
  der.set(s, offset);

  return der;
}

// ============================================================================
// Tests
// ============================================================================

describe("kms-eth", () => {
  let mockClient: KMSClient;
  let mockSend: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = new KMSClient({});
    mockSend = (mockClient as unknown as { send: jest.Mock }).send;
  });

  describe("createManagerKey", () => {
    it("derives correct Ethereum address from SPKI public key", async () => {
      mockSend
        .mockResolvedValueOnce({
          KeyMetadata: { KeyId: "key-123", CreationDate: new Date() },
        })
        .mockResolvedValueOnce({ PublicKey: SPKI_PUBLIC_KEY });

      const result = await createManagerKey(mockClient, "rp_123");

      expect(result?.address.toLowerCase()).toBe(
        EXPECTED_ADDRESS_FOR_GENERATOR.toLowerCase(),
      );
    });
  });

  describe("signEthDigestWithKms", () => {
    it("correctly verifies a signature and recovers the expected address", async () => {
      // Create a test wallet
      const wallet = new Wallet(TEST_PRIVATE_KEY);
      const expectedAddress = wallet.address;

      // Create a test digest (32 bytes)
      const message = "Hello, World!";
      const digest = getBytes(keccak256(new TextEncoder().encode(message)));

      // Sign the digest with ethers (this gives us a known-good signature)
      const ethersSignature = wallet.signingKey.sign(digest);

      // Convert to DER format (simulating KMS response)
      const derSignature = signatureToDer(ethersSignature);

      // Create SPKI public key for the test wallet
      const uncompressedPubKey = getBytes(wallet.signingKey.publicKey);
      const spkiPubKey = createSpkiPublicKey(uncompressedPubKey);

      // Mock KMS responses
      mockSend
        // GetPublicKeyCommand
        .mockResolvedValueOnce({ PublicKey: spkiPubKey })
        // SignCommand
        .mockResolvedValueOnce({ Signature: derSignature });

      // Call our function
      const result = await signEthDigestWithKms(
        mockClient,
        "test-key-id",
        digest,
      );

      // Verify the result
      expect(result).toBeDefined();
      expect(result?.r).toBeDefined();
      expect(result?.s).toBeDefined();
      expect(result?.v).toBeGreaterThanOrEqual(27);
      expect(result?.v).toBeLessThanOrEqual(28);
      expect(result?.serialized).toBeDefined();

      // Most importantly: verify the signature recovers to the correct address
      const recoveredAddress = recoverAddress(digest, result!.serialized);
      expect(recoveredAddress.toLowerCase()).toBe(expectedAddress.toLowerCase());
    });

    it("returns undefined for invalid digest length", async () => {
      const result = await signEthDigestWithKms(
        mockClient,
        "test-key-id",
        new Uint8Array(31), // Wrong length
      );

      expect(result).toBeUndefined();
      expect(mockSend).not.toHaveBeenCalled();
    });
  });
});
