import "server-only";

/**
 * Contains all functions for interacting with Amazon KMS
 */

import { retrieveJWK } from "@/api/helpers/jwks";
import { logger } from "@/lib/logger";
import {
  CreateKeyCommand,
  DescribeKeyCommand,
  GetPublicKeyCommand,
  KMSClient,
  KeySpec,
  ScheduleKeyDeletionCommand,
  SignCommand,
} from "@aws-sdk/client-kms";
import { base64url } from "jose";

export type CreateKeyResult =
  | {
      keyId: string;
      publicKey: string;
      createdAt: Date;
    }
  | undefined;

export const getKMSClient = async (region?: string) => {
  return new KMSClient({
    region: region ?? process.env.AWS_REGION_NAME,
  });
};

/**
 * Resolves a KMS key reference to a full ARN for cross-account access.
 *
 * - Full ARN (`arn:aws:kms:...`): returned as-is (new keys or already resolved)
 * - Bare key ID (UUID): if `KMS_LEGACY_ACCOUNT_ID` is set, constructs a full
 *   ARN pointing to the legacy account; otherwise returns as-is
 *
 * This enables a seamless migration period where the application runs in a new
 * AWS account but still uses KMS keys that remain in the old account.
 */
export function resolveKeyId(keyId: string, region?: string): string {
  if (keyId.startsWith("arn:")) {
    return keyId;
  }

  const legacyAccountId = process.env.KMS_LEGACY_ACCOUNT_ID;
  if (!legacyAccountId) {
    return keyId;
  }

  const resolvedRegion =
    region ?? process.env.AWS_REGION_NAME ?? "eu-west-1";
  return `arn:aws:kms:${resolvedRegion}:${legacyAccountId}:key/${keyId}`;
}

export const createKMSKey = async (
  client: KMSClient,
  alg: KeySpec,
): Promise<CreateKeyResult> => {
  try {
    const { KeyMetadata } = await client.send(
      new CreateKeyCommand({
        KeySpec: alg,
        KeyUsage: "SIGN_VERIFY",
        Description: `Developer Portal JWK for Sign in with World ID. Created: ${new Date().toISOString()}`,
        Tags: [{ TagKey: "app", TagValue: "developer-portal" }],
      }),
    );

    const keyId = KeyMetadata?.Arn ?? KeyMetadata?.KeyId;
    const createdAt = KeyMetadata?.CreationDate;

    if (keyId && createdAt) {
      const { PublicKey } = await client.send(
        new GetPublicKeyCommand({ KeyId: keyId }),
      );

      if (PublicKey) {
        const publicKey = `-----BEGIN PUBLIC KEY-----
${Buffer.from(PublicKey).toString("base64")}
-----END PUBLIC KEY-----`;

        return { keyId, publicKey, createdAt };
      }
    }
  } catch (error) {
    logger.error("Error creating key.", { error });
  }
};

export const getKMSKeyStatus = async (client: KMSClient, keyId: string) => {
  try {
    const { KeyMetadata } = await client.send(
      new DescribeKeyCommand({
        KeyId: resolveKeyId(keyId),
      }),
    );
    return KeyMetadata?.Enabled;
  } catch (error) {
    logger.error("Error describing key.", { error });
  }
};

export const signJWTWithKMSKey = async (
  client: KMSClient,
  header: Record<string, any>,
  payload: Record<string, any>,
) => {
  const encodedHeader = base64url.encode(JSON.stringify(header));
  const encodedPayload = base64url.encode(JSON.stringify(payload));
  const encodedHeaderPayload = `${encodedHeader}.${encodedPayload}`;

  try {
    const { kms_id } = await retrieveJWK(header.kid); // NOTE: JWK is already verified to be active at this point

    if (!kms_id) {
      throw new Error("KMS ID not found.");
    }

    const response = await client.send(
      new SignCommand({
        KeyId: resolveKeyId(kms_id),
        Message: new Uint8Array(Buffer.from(encodedHeaderPayload)),
        MessageType: "RAW",
        SigningAlgorithm: "RSASSA_PKCS1_V1_5_SHA_256",
      }),
    );

    if (response?.Signature) {
      // See: https://www.rfc-editor.org/rfc/rfc7515#appendix-C
      const encodedSignature = base64url
        .encode(response.Signature)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");
      return `${encodedHeaderPayload}.${encodedSignature}`;
    }
  } catch (error) {
    logger.error("Error signing JWT:", { error });
  }
};

export const scheduleKeyDeletion = async (client: KMSClient, keyId: string) => {
  try {
    await client.send(
      new ScheduleKeyDeletionCommand({
        KeyId: resolveKeyId(keyId),
        PendingWindowInDays: 7, // Note: 7 is the minimum allowed value
      }),
    );
  } catch (error) {
    logger.error("Error scheduling key deletion:", { error });
  }
};
