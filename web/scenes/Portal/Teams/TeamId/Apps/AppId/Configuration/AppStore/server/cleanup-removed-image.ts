"use server";

import { expireUnverifiedImage } from "@/api/helpers/image-processing";
import { logger } from "@/lib/logger";
import { S3Client } from "@aws-sdk/client-s3";

type ImageType = "logo_img" | "content_card_image";

/**
 * Marks a removed image as expired in S3 so lifecycle rules clean it up.
 * Non-blocking: failures are logged but never surface to the caller.
 */
export async function cleanupRemovedImage(
  appId: string,
  appMetadataId: string,
  imageType: ImageType,
  oldImagePath: string | null | undefined,
): Promise<void> {
  if (!oldImagePath || oldImagePath.trim() === "") {
    return;
  }

  const bucketName = process.env.ASSETS_S3_BUCKET_NAME;
  const region = process.env.ASSETS_S3_REGION;

  if (!bucketName || !region) {
    logger.warn("S3 configuration missing, skipping image cleanup", {
      appId,
      imageType,
    });
    return;
  }

  try {
    const s3Client = new S3Client({ region });

    await expireUnverifiedImage(s3Client, bucketName, appId, oldImagePath);
  } catch (error) {
    logger.error("Error during image cleanup", {
      error,
      appId,
      appMetadataId,
      imageType,
      oldImagePath,
    });
  }
}
