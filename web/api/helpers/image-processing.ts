import { logger } from "@/lib/logger";
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import sharp from "sharp";

/**
 * Downloads an image from S3, resizes it, and uploads the resized version back to S3
 * @param s3Client - The S3 client instance
 * @param bucketName - The S3 bucket name
 * @param sourceKey - The source image key in S3
 * @param destinationFolder - The destination folder for the resized image
 * @param imageKey - The image key in the destination folder
 * @param width - The width of the resized image
 * @param height - The height of the resized image
 * @param cornerRadius - The radius of the rounded corners
 * @param quality - The quality of the resized image
 * @returns Promise<{
 *   originalImageKey: string; // The key of the original image
 *   minimizedImageKey: string; // The key of the minimized image
 *   roundedImageKey: string; // The key of the rounded image
 * }>
 */
export const processLogoImage = async (
  s3Client: S3Client,
  bucketName: string,
  sourceKey: string,
  destinationFolder: string,
  imageKey: string,
  width: number,
  height: number,
  cornerRadius: number,
  quality: number,
  fileType: string,
): Promise<void> => {
  try {
    const getObjectResponse = await s3Client.send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: sourceKey,
      }),
    );

    if (!getObjectResponse.Body) {
      throw new Error(`Failed to download image from S3: ${sourceKey}`);
    }

    const imageBuffer = await streamToBuffer(getObjectResponse.Body);

    // Get original image dimensions
    const metadata = await sharp(imageBuffer).metadata();
    const originalWidth = metadata.width ?? 0;
    const originalHeight = metadata.height ?? 0;

    // Calculate dimensions: use original if smaller and valid, otherwise use provided dimensions
    const targetWidth =
      originalWidth > 0 ? Math.min(originalWidth, width) : width;
    const targetHeight =
      originalHeight > 0 ? Math.min(originalHeight, height) : height;

    // Create minimized image in original format
    const resizedImage = sharp(imageBuffer).resize(targetWidth, targetHeight, {
      fit: "cover",
      position: "center",
    });

    const minimizedImageBuffer = await (
      fileType === "png"
        ? resizedImage.png({ quality })
        : resizedImage.jpeg({ quality })
    ).toBuffer();

    const roundedCornerSvg = `
      <svg width="${targetWidth}" height="${targetHeight}">
        <rect x="0" y="0" width="${targetWidth}" height="${targetHeight}" rx="${cornerRadius}" ry="${cornerRadius}" fill="white"/>
      </svg>
    `;

    const roundedImageBuffer = await sharp(imageBuffer)
      .resize(targetWidth, targetHeight, {
        fit: "cover",
        position: "center",
      })
      .composite([
        {
          input: Buffer.from(roundedCornerSvg),
          blend: "dest-in",
        },
      ])
      .png({ quality })
      .toBuffer();

    const originalImageKey = `${destinationFolder}${imageKey}_original.${fileType}`;
    const minimizedImageKey = `${destinationFolder}${imageKey}.${fileType}`;
    const roundedImageKey = `${destinationFolder}${imageKey}_rounded.png`; // Always PNG

    const putMinifiedImagePromise = s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: minimizedImageKey,
        Body: minimizedImageBuffer,
        ContentType: `image/${fileType === "png" ? "png" : "jpeg"}`,
      }),
    );

    const copyOriginalImagePromise = s3Client.send(
      new CopyObjectCommand({
        Bucket: bucketName,
        CopySource: `${bucketName}/${sourceKey}`,
        Key: originalImageKey,
      }),
    );

    const putRoundedImagePromise = s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: roundedImageKey,
        Body: roundedImageBuffer,
        ContentType: "image/png", // Always PNG for rounded images
      }),
    );

    await Promise.all([
      putMinifiedImagePromise,
      copyOriginalImagePromise,
      putRoundedImagePromise,
    ]);

    logger.info(`Successfully processed and uploaded logo images`, {
      originalImageKey,
      minimizedImageKey,
      roundedImageKey,
      originalWidth,
      originalHeight,
      targetWidth,
      targetHeight,
      cornerRadius,
    });
  } catch (error) {
    logger.error(`Failed to process logo image: ${error}`, {
      sourceKey,
      destinationFolder,
      imageKey,
      maxWidth: width,
      maxHeight: height,
      cornerRadius,
    });
    throw error;
  }
};

/**
 * Converts a readable stream to a buffer
 * @param stream - The readable stream
 * @returns Promise<Buffer>
 */
const streamToBuffer = async (stream: any): Promise<Buffer> => {
  const chunks: Uint8Array[] = [];

  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
};

/**
 * Downloads an image from S3, adds a footer, and uploads the resized version back to S3
 * @param s3Client - The S3 client instance
 * @param bucketName - The S3 bucket name
 * @param sourceKey - The source image key in S3
 * @param destinationKey - The destination image key in S3
 * @param fileType - The file type of the image
 */
export const processContentCardImage = async (
  s3Client: S3Client,
  bucketName: string,
  sourceKey: string,
  destinationKey: string,
  fileType: string,
): Promise<void> => {
  try {
    const getObjectResponse = await s3Client.send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: sourceKey,
      }),
    );

    if (!getObjectResponse.Body) {
      throw new Error(`Failed to download image from S3: ${sourceKey}`);
    }

    const contentType = `image/${fileType === "png" ? "png" : "jpeg"}`;
    const imageBuffer = await streamToBuffer(getObjectResponse.Body);

    const imageWithFooter = await addFooter(imageBuffer, 0.33, 0.5, fileType);

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: destinationKey,
        Body: imageWithFooter,
        ContentType: contentType,
      }),
    );
  } catch (error) {
    logger.error(`Failed to process content card image: ${error}`, {
      sourceKey,
      destinationKey,
    });
    throw error;
  }
};

/** Add a semi-transparent footer rectangle to the bottom. */
const addFooter = async (
  imageBuffer: Buffer,
  footerRelHeight: number,
  alpha: number,
  fileType: string,
): Promise<Buffer> => {
  const base = sharp(imageBuffer);
  const meta = await base.metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;

  const footerH = Math.max(1, Math.round(height * footerRelHeight));

  // Create the footer overlay (RGBA)
  const footer = await sharp({
    create: {
      width,
      height: footerH,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha },
    },
  })
    .png()
    .toBuffer();

  // Composite the footer at the bottom
  const compositeImage = base.composite([
    { input: footer, left: 0, top: height - footerH },
  ]);

  return await (
    fileType === "png"
      ? compositeImage.png({ quality: 100 })
      : compositeImage.jpeg({ quality: 100 })
  ).toBuffer();
};

/**
 * Deletes an unverified image from S3
 * @param s3Client - The S3 client instance
 * @param bucketName - The S3 bucket name
 * @param appId - The app ID
 * @param imagePath - The image path (e.g., "meta_tag_image.png", "showcase_img_1.png")
 * @param locale - Optional locale for localized images (e.g., "es", "fr"). If not provided, assumes English (no locale prefix)
 * @returns Promise<boolean> - Returns true if deletion was successful or image didn't exist, false on error
 */
export const deleteUnverifiedImage = async (
  s3Client: S3Client,
  bucketName: string,
  appId: string,
  imagePath: string,
  locale?: string,
): Promise<boolean> => {
  if (!imagePath || imagePath.trim() === "") {
    logger.warn("Attempted to delete image with empty path", { appId, locale });
    return true; // Not an error, just nothing to delete
  }

  try {
    // Construct the S3 key path
    // English images: unverified/{app_id}/{image_path}
    // Localized images: unverified/{app_id}/{locale}/{image_path}
    const s3Key = `unverified/${appId}${locale && locale !== "en" ? `/${locale}` : ""
      }/${imagePath}`;

    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: s3Key,
      }),
    );

    logger.info("Successfully deleted unverified image from S3", {
      appId,
      locale,
      imagePath,
      s3Key,
    });

    return true;
  } catch (error) {
    // Log error but don't throw - we don't want image deletion failures to break the update flow
    logger.error("Failed to delete unverified image from S3", {
      error,
      appId,
      locale,
      imagePath,
    });
    return false;
  }
};
