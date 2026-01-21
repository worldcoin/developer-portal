import "server-only";

/**
 * Ethereum utilities for KMS signature handling.
 * Handles DER signature parsing, low-S normalization, and address derivation.
 */

import {
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

// secp256k1 curve order
const SECP256K1_N = BigInt(
  "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141",
);
const SECP256K1_N_DIV_2 = SECP256K1_N / 2n;

/**
 * Parsed ECDSA signature components.
 */
export interface ParsedSignature {
  r: Uint8Array;
  s: Uint8Array;
}

/**
 * Ethereum-compatible signature with recovery parameter.
 */
export interface EthereumSignature {
  r: string;
  s: string;
  v: number;
  serialized: string;
}

/**
 * Parses a DER-encoded ECDSA signature into r and s components.
 *
 * DER format: 0x30 [total-length] 0x02 [r-length] [r] 0x02 [s-length] [s]
 *
 * @param derSignature - The DER-encoded signature bytes
 * @returns Parsed r and s components as 32-byte Uint8Arrays
 */
export function parseDerSignature(derSignature: Uint8Array): ParsedSignature {
  // Validate SEQUENCE tag
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
 *
 * @param s - The S component as a 32-byte Uint8Array
 * @returns Normalized S value
 */
export function normalizeSValue(s: Uint8Array): Uint8Array {
  const sValue = BigInt(hexlify(s));

  if (sValue > SECP256K1_N_DIV_2) {
    // s = n - s
    const normalizedS = SECP256K1_N - sValue;
    return new Uint8Array(getBytes(zeroPadValue(toBeHex(normalizedS), 32)));
  }

  return s;
}

/**
 * Converts a Uint8Array to a hex string with 0x prefix.
 * Re-exported from ethers for convenience.
 */
export { hexlify as bytesToHex } from "ethers";

/**
 * Extracts the uncompressed public key from SPKI-formatted public key.
 * SPKI format has a header before the actual key bytes.
 *
 * @param spkiPublicKey - The SPKI-formatted public key
 * @returns The 65-byte uncompressed public key (04 || x || y)
 */
export function extractPublicKeyFromSpki(spkiPublicKey: Uint8Array): Uint8Array {
  // SPKI for secp256k1: 26 bytes header + 65 bytes uncompressed public key
  // The uncompressed key starts with 0x04
  const keyStart = spkiPublicKey.length - 65;
  const publicKey = spkiPublicKey.slice(keyStart);

  if (publicKey[0] !== 0x04) {
    throw new Error("Invalid public key: expected uncompressed format (0x04)");
  }

  return publicKey;
}

/**
 * Derives an Ethereum address from an uncompressed public key.
 *
 * @param publicKey - The 65-byte uncompressed public key (04 || x || y)
 * @returns The checksummed Ethereum address
 */
export function publicKeyToAddress(publicKey: Uint8Array): string {
  if (publicKey.length !== 65 || publicKey[0] !== 0x04) {
    throw new Error(
      "Invalid public key: expected 65-byte uncompressed format starting with 0x04",
    );
  }

  // ethers computeAddress handles uncompressed public keys directly
  return computeAddress(hexlify(publicKey));
}

/**
 * Gets the Ethereum address for a KMS key.
 *
 * @param client - The KMS client
 * @param keyId - The KMS key ID
 * @returns The checksummed Ethereum address
 */
export async function getEthAddressFromKMS(
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

/**
 * Signs a digest with KMS and returns an Ethereum-compatible signature.
 *
 * @param client - The KMS client
 * @param keyId - The KMS key ID
 * @param digest - The 32-byte message digest to sign
 * @param expectedAddress - The expected signer address (for v recovery)
 * @returns Ethereum signature with r, s, v components
 */
export async function createKmsSignature(
  client: KMSClient,
  keyId: string,
  digest: Uint8Array,
  expectedAddress: string,
): Promise<EthereumSignature> {
  // Sign with KMS
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

  // Parse DER signature
  const { r, s: rawS } = parseDerSignature(new Uint8Array(derSignature));

  // Normalize S to low-S form
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
        return {
          r: rHex,
          s: sHex,
          v,
          serialized: sig.serialized,
        };
      }
    } catch {
      // Try next v value
    }
  }

  throw new Error("Failed to recover correct address from signature");
}
