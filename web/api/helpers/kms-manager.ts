import "server-only";

/**
 * Contains functions for managing RP manager keys in AWS KMS.
 * Manager keys are secp256k1 Ethereum keypairs used for on-chain RP operations.
 */

import { logger } from "@/lib/logger";
import {
  CreateKeyCommand,
  GetPublicKeyCommand,
  KMSClient,
  ScheduleKeyDeletionCommand,
} from "@aws-sdk/client-kms";
import { getEthAddressFromKMS, KMSSigner } from "@rumblefishdev/eth-signer-kms";
import type { TypedDataDomain, TypedDataField } from "ethers";

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
 * Creates a new secp256k1 manager key for an RP.
 *
 * The key is created with:
 * - KeySpec: ECC_SECG_P256K1 (secp256k1)
 * - KeyUsage: SIGN_VERIFY
 * - Tags: app=developer-portal, rpId=<rpId>, purpose=rp-manager
 *
 * @param client - The KMS client
 * @param rpId - The RP identifier for tagging
 * @returns Key ID, Ethereum address, and creation date; undefined on error
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
          { TagKey: "purpose", TagValue: "rp-manager" },
        ],
      }),
    );

    const keyId = KeyMetadata?.KeyId;
    const createdAt = KeyMetadata?.CreationDate;

    if (!keyId || !createdAt) {
      logger.error("Key creation returned incomplete metadata", { rpId });
      return undefined;
    }

    // Get the Ethereum address using the library
    const address = await getEthAddressFromKMS(client, keyId);

    return {
      keyId,
      address,
      createdAt,
    };
  } catch (error) {
    logger.error("Error creating manager key", { error, rpId });
    return undefined;
  }
}

/**
 * Gets the Ethereum address for a manager key.
 *
 * @param client - The KMS client
 * @param keyId - The KMS key ID or ARN
 * @returns The checksummed Ethereum address; undefined on error
 */
export async function getManagerAddress(
  client: KMSClient,
  keyId: string,
): Promise<string | undefined> {
  try {
    return await getEthAddressFromKMS(client, keyId);
  } catch (error) {
    logger.error("Error getting manager address", { error, keyId });
    return undefined;
  }
}

/**
 * Gets the raw public key bytes for a manager key.
 *
 * @param client - The KMS client
 * @param keyId - The KMS key ID or ARN
 * @returns The public key in SPKI format; undefined on error
 */
export async function getManagerPublicKey(
  client: KMSClient,
  keyId: string,
): Promise<Uint8Array | undefined> {
  try {
    const { PublicKey } = await client.send(
      new GetPublicKeyCommand({ KeyId: keyId }),
    );

    if (!PublicKey) {
      logger.error("Could not retrieve public key", { keyId });
      return undefined;
    }

    return new Uint8Array(PublicKey);
  } catch (error) {
    logger.error("Error getting manager public key", { error, keyId });
    return undefined;
  }
}

/**
 * Signs a 32-byte digest with a manager key.
 *
 * @param client - The KMS client
 * @param keyId - The KMS key ID or ARN
 * @param digest - The 32-byte hash to sign
 * @returns Ethereum signature with r, s, v components; undefined on error
 */
export async function signWithManagerKey(
  client: KMSClient,
  keyId: string,
  digest: Uint8Array,
): Promise<EthSignature | undefined> {
  if (digest.length !== 32) {
    logger.error("Digest must be 32 bytes", { digestLength: digest.length });
    return undefined;
  }

  try {
    // Create a KMSSigner instance (doesn't need a provider for signing digests)
    const signer = new KMSSigner(null, keyId, client);

    // Sign the digest
    const signature = await signer.signDigest(digest);

    return {
      r: signature.r,
      s: signature.s,
      v: signature.v,
      serialized: signature.serialized,
    };
  } catch (error) {
    logger.error("Error signing with manager key", { error, keyId });
    return undefined;
  }
}

/**
 * Signs EIP-712 typed data with a manager key.
 *
 * @param client - The KMS client
 * @param keyId - The KMS key ID or ARN
 * @param domain - EIP-712 domain separator fields
 * @param types - EIP-712 type definitions (without EIP712Domain)
 * @param message - The structured message to sign
 * @returns Ethereum signature with r, s, v components; undefined on error
 */
export async function signTypedDataWithManagerKey(
  client: KMSClient,
  keyId: string,
  domain: TypedDataDomain,
  types: Record<string, TypedDataField[]>,
  message: Record<string, unknown>,
): Promise<EthSignature | undefined> {
  try {
    // Create a KMSSigner instance
    const signer = new KMSSigner(null, keyId, client);

    // Sign typed data using the signer's signTypedData method
    const signature = await signer.signTypedData(domain, types, message);

    // Parse the signature to extract r, s, v
    // The signature is a 65-byte hex string (0x + 130 chars)
    const sigBytes = signature.slice(2); // Remove 0x
    const r = "0x" + sigBytes.slice(0, 64);
    const s = "0x" + sigBytes.slice(64, 128);
    const v = parseInt(sigBytes.slice(128, 130), 16);

    return {
      r,
      s,
      v,
      serialized: signature,
    };
  } catch (error) {
    logger.error("Error signing typed data with manager key", { error, keyId });
    return undefined;
  }
}

/**
 * Schedules a manager key for deletion.
 *
 * AWS KMS requires a minimum 7-day waiting period before deletion.
 *
 * @param client - The KMS client
 * @param keyId - The KMS key ID or ARN
 */
export async function scheduleManagerKeyDeletion(
  client: KMSClient,
  keyId: string,
): Promise<void> {
  try {
    await client.send(
      new ScheduleKeyDeletionCommand({
        KeyId: keyId,
        PendingWindowInDays: 7, // Minimum allowed value
      }),
    );
  } catch (error) {
    logger.error("Error scheduling manager key deletion", { error, keyId });
  }
}
