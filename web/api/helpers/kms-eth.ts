import "server-only";

/**
 * Ethereum utilities for KMS key management and signing.
 * Handles secp256k1 key creation, DER signature parsing, low-S normalization,
 * address derivation, and Ethereum-compatible signing.
 */

import { logger } from "@/lib/logger";
import {
  CreateKeyCommand,
  GetPublicKeyCommand,
  KMSClient,
  SignCommand,
} from "@aws-sdk/client-kms";
import {
  computeAddress,
  getBytes,
  hexlify,
  recoverAddress,
  Signature,
  toBeHex,
  zeroPadValue,
} from "ethers";
import { scheduleKeyDeletion } from "./kms";

// secp256k1 curve order
const SECP256K1_N = BigInt(
  "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141",
);
const SECP256K1_N_DIV_2 = SECP256K1_N / 2n;

// ============================================================================
// Types
// ============================================================================

/**
 * Parsed ECDSA signature components.
 */
interface ParsedSignature {
  r: Uint8Array;
  s: Uint8Array;
}

/**
 * Ethereum signature with r, s, v components.
 */
export interface EthSignature {
  /** r component as hex string (32 bytes, 0x-prefixed) */
  r: string;
  /** s component as hex string (32 bytes, 0x-prefixed) */
  s: string;
  /** Recovery parameter (27 or 28) */
  v: number;
  /** Serialized signature (65 bytes, 0x-prefixed): r || s || v */
  serialized: string;
}

/**
 * Result of creating a new manager key.
 */
export interface CreateManagerKeyResult {
  /** The KMS key ID */
  keyId: string;
  /** The Ethereum address derived from the public key */
  address: string;
  /** When the key was created */
  createdAt: Date;
}

// ============================================================================
// DER Signature Parsing
// ============================================================================

/**
 * Parses a DER-encoded ECDSA signature into r and s components.
 *
 * DER format: 0x30 [total-length] 0x02 [r-length] [r] 0x02 [s-length] [s]
 */
function parseDerSignature(derSignature: Uint8Array): ParsedSignature {
  if (derSignature[0] !== 0x30) {
    throw new Error("Invalid DER signature: missing SEQUENCE tag");
  }

  let offset = 2; // Skip SEQUENCE tag and length

  // Parse r
  if (derSignature[offset] !== 0x02) {
    throw new Error("Invalid DER signature: missing INTEGER tag for r");
  }
  offset++;
  const rLength = derSignature[offset];
  offset++;
  const rRaw = derSignature.slice(offset, offset + rLength);
  offset += rLength;

  // Parse s
  if (derSignature[offset] !== 0x02) {
    throw new Error("Invalid DER signature: missing INTEGER tag for s");
  }
  offset++;
  const sLength = derSignature[offset];
  offset++;
  const sRaw = derSignature.slice(offset, offset + sLength);

  // Remove leading zeros and pad to 32 bytes
  const r = padTo32Bytes(trimLeadingZeros(rRaw));
  const s = padTo32Bytes(trimLeadingZeros(sRaw));

  return { r, s };
}

/**
 * Removes leading zero bytes from a byte array.
 */
function trimLeadingZeros(bytes: Uint8Array): Uint8Array {
  let start = 0;
  while (start < bytes.length - 1 && bytes[start] === 0) {
    start++;
  }
  return bytes.slice(start);
}

/**
 * Pads a byte array to 32 bytes with leading zeros.
 */
function padTo32Bytes(bytes: Uint8Array): Uint8Array {
  if (bytes.length === 32) return bytes;
  if (bytes.length > 32) {
    throw new Error(`Value too large: ${bytes.length} bytes`);
  }
  return new Uint8Array(getBytes(zeroPadValue(hexlify(bytes), 32)));
}

/**
 * Normalizes the S value to be in the lower half of the curve order.
 * Ethereum requires s < secp256k1_n / 2 (EIP-2).
 */
function normalizeSValue(s: Uint8Array): Uint8Array {
  const sValue = BigInt(hexlify(s));

  if (sValue > SECP256K1_N_DIV_2) {
    const normalizedS = SECP256K1_N - sValue;
    return new Uint8Array(getBytes(zeroPadValue(toBeHex(normalizedS), 32)));
  }

  return s;
}

// ============================================================================
// Public Key Utilities
// ============================================================================

/**
 * Extracts the uncompressed public key from SPKI-formatted public key.
 */
function extractPublicKeyFromSpki(spkiPublicKey: Uint8Array): Uint8Array {
  // SPKI for secp256k1: 26 bytes header + 65 bytes uncompressed public key
  const keyStart = spkiPublicKey.length - 65;
  const publicKey = spkiPublicKey.slice(keyStart);

  if (publicKey[0] !== 0x04) {
    throw new Error("Invalid public key: expected uncompressed format (0x04)");
  }

  return publicKey;
}

/**
 * Derives an Ethereum address from an uncompressed public key.
 */
function publicKeyToAddress(publicKey: Uint8Array): string {
  if (publicKey.length !== 65 || publicKey[0] !== 0x04) {
    throw new Error(
      "Invalid public key: expected 65-byte uncompressed format starting with 0x04",
    );
  }

  return computeAddress(hexlify(publicKey));
}

/**
 * Gets the Ethereum address for a KMS key.
 */
async function getEthAddressFromKMS(
  client: KMSClient,
  keyId: string,
): Promise<string> {
  const { PublicKey } = await client.send(
    new GetPublicKeyCommand({ KeyId: keyId }),
  );

  if (!PublicKey) {
    throw new Error("Failed to get public key from KMS");
  }

  const spkiKey = new Uint8Array(PublicKey);
  const uncompressedKey = extractPublicKeyFromSpki(spkiKey);
  return publicKeyToAddress(uncompressedKey);
}

// ============================================================================
// KMS Signing
// ============================================================================

/**
 * Signs a digest with KMS and returns an Ethereum-compatible signature.
 */
async function signWithKms(
  client: KMSClient,
  keyId: string,
  digest: Uint8Array,
  expectedAddress: string,
): Promise<EthSignature> {
  const { Signature: derSignature } = await client.send(
    new SignCommand({
      KeyId: keyId,
      Message: digest,
      MessageType: "DIGEST",
      SigningAlgorithm: "ECDSA_SHA_256",
    }),
  );

  if (!derSignature) {
    throw new Error("KMS signing failed: no signature returned");
  }

  const { r, s: rawS } = parseDerSignature(new Uint8Array(derSignature));
  const s = normalizeSValue(rawS);

  const rHex = hexlify(r);
  const sHex = hexlify(s);
  const digestHex = hexlify(digest);

  // Try v = 27 first, then v = 28
  for (const v of [27, 28]) {
    try {
      const sig = Signature.from({ r: rHex, s: sHex, v });
      const recovered = recoverAddress(digestHex, sig);

      if (recovered.toLowerCase() === expectedAddress.toLowerCase()) {
        return { r: rHex, s: sHex, v, serialized: sig.serialized };
      }
    } catch {
      // Try next v value
    }
  }

  throw new Error("Failed to recover correct address from signature");
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Creates a new secp256k1 manager key for an RP.
 */
export async function createManagerKey(
  client: KMSClient,
  rpId: string,
): Promise<CreateManagerKeyResult | undefined> {
  try {
    const { KeyMetadata } = await client.send(
      new CreateKeyCommand({
        KeySpec: "ECC_SECG_P256K1",
        KeyUsage: "SIGN_VERIFY",
        Description: `Manager key for RP ${rpId}. Created: ${new Date().toISOString()}`,
        Tags: [
          { TagKey: "app", TagValue: "developer-portal" },
          { TagKey: "rpId", TagValue: rpId },
        ],
      }),
    );

    const keyId = KeyMetadata?.KeyId;
    const createdAt = KeyMetadata?.CreationDate;

    if (!keyId || !createdAt) {
      logger.error("Key creation returned incomplete metadata", { rpId });
      return undefined;
    }

    let address: string;
    try {
      address = await getEthAddressFromKMS(client, keyId);
    } catch (addressError) {
      logger.error("Failed to derive address, scheduling key for deletion", {
        error: addressError,
        keyId,
        rpId,
      });
      await scheduleKeyDeletion(client, keyId);
      return undefined;
    }

    return { keyId, address, createdAt };
  } catch (error) {
    logger.error("Error creating manager key", { error, rpId });
    return undefined;
  }
}

/**
 * Signs a 32-byte digest with a KMS key and returns an Ethereum signature.
 */
export async function signEthDigestWithKms(
  client: KMSClient,
  keyId: string,
  digest: Uint8Array,
): Promise<EthSignature | undefined> {
  if (digest.length !== 32) {
    return undefined;
  }

  try {
    const address = await getEthAddressFromKMS(client, keyId);
    return await signWithKms(client, keyId, digest, address);
  } catch {
    return undefined;
  }
}
