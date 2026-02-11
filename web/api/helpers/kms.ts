import "server-only";

/**
 * Contains all functions for interacting with Amazon KMS
 */

import { logger } from "@/lib/logger";
import {
  CreateKeyCommand,
  DescribeKeyCommand,
  GetPublicKeyCommand,
  KMSClient,
  KeySpec,
  ScheduleKeyDeletionCommand,
} from "@aws-sdk/client-kms";

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

    const keyId = KeyMetadata?.KeyId;
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
        KeyId: keyId,
      }),
    );
    return KeyMetadata?.Enabled;
  } catch (error) {
    logger.error("Error describing key.", { error });
  }
};

export const scheduleKeyDeletion = async (client: KMSClient, keyId: string) => {
  try {
    await client.send(
      new ScheduleKeyDeletionCommand({
        KeyId: keyId,
        PendingWindowInDays: 7, // Note: 7 is the minimum allowed value
      }),
    );
  } catch (error) {
    logger.error("Error scheduling key deletion:", { error });
  }
};
