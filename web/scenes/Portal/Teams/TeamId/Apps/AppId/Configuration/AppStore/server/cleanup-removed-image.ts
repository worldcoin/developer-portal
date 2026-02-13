"use server";

import { deleteUnverifiedImage } from "@/api/helpers/image-processing";
import { logger } from "@/lib/logger";
import { S3Client } from "@aws-sdk/client-s3";

type ImageType = "logo_img" | "content_card_image";

/**
 * Cleans up a removed image from S3 storage
 * @param appId - The app ID
 * @param appMetadataId - The app metadata ID (for logging purposes)
 * @param imageType - The type of image being removed ("logo_img" or "content_card_image")
 * @param oldImagePath - The image path to delete (e.g., "logo_img.png", "content_card_image.jpg")
 * @returns Promise with success status
 */
export async function cleanupRemovedImage(
  appId: string,
  appMetadataId: string,
  imageType: ImageType,
  oldImagePath: string | null | undefined,
): Promise<{ success: boolean }> {
  // If no old image path, nothing to clean up
  if (!oldImagePath || oldImagePath.trim() === "") {
    return { success: true };
  }

  const bucketName = process.env.ASSETS_S3_BUCKET_NAME;
  const region = process.env.ASSETS_S3_REGION;

  if (!bucketName || !region) {
    logger.warn("S3 configuration missing, skipping image cleanup", {
      appId,
      appMetadataId,
      imageType,
      oldImagePath,
    });
    return { success: false };
  }

  try {
    const s3Client = new S3Client({ region });

    // Logo and content card images are always stored in the English (non-localized) path
    // Path format: unverified/{app_id}/{image_path}
    const success = await deleteUnverifiedImage(
      s3Client,
      bucketName,
      appId,
      oldImagePath,
      // No locale parameter - these images are always in the root app folder
    );

    if (success) {
      logger.info("Successfully cleaned up removed image", {
        appId,
        appMetadataId,
        imageType,
        oldImagePath,
      });
    } else {
      logger.warn("Failed to clean up removed image", {
        appId,
        appMetadataId,
        imageType,
        oldImagePath,
      });
    }

    return { success };
  } catch (error) {
    // Log error but don't throw - we don't want cleanup failures to break the UI
    logger.error("Error during image cleanup", {
      error,
      appId,
      appMetadataId,
      imageType,
      oldImagePath,
    });
    return { success: false };
  }
}
