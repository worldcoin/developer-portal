import "server-only";

/**
 * Contains all functions for interacting with Amazon KMS
 */

import { logger } from "@/lib/logger";
import {
  DescribeKeyCommand,
  KMSClient,
  ScheduleKeyDeletionCommand,
} from "@aws-sdk/client-kms";

export const getKMSClient = async (region?: string) => {
  return new KMSClient({
    region: region ?? process.env.AWS_REGION_NAME,
  });
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
