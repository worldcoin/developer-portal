import { logger } from "@/lib/logger";
import {
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

    const contentType = "image/png";
    const imageBuffer = await streamToBuffer(getObjectResponse.Body);

    const minimizedImageBuffer = await sharp(imageBuffer)
      .resize(width, height, {
        fit: "cover",
        position: "center",
      })
      .png({ quality })
      .toBuffer();

    const roundedCornerSvg = `
      <svg width="${width}" height="${height}">
        <rect x="0" y="0" width="${width}" height="${height}" rx="${cornerRadius}" ry="${cornerRadius}" fill="white"/>
      </svg>
    `;

    const roundedImageBuffer = await sharp(imageBuffer)
      .resize(width, height, {
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

    const originalImageBuffer = await sharp(imageBuffer).png().toBuffer();

    const originalImageKey = `${destinationFolder}${imageKey}_original.png`;
    const minimizedImageKey = `${destinationFolder}${imageKey}.png`;
    const roundedImageKey = `${destinationFolder}${imageKey}_rounded.png`;

    const putMinifiedImagePromise = s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: minimizedImageKey,
        Body: minimizedImageBuffer,
        ContentType: contentType,
      }),
    );

    const putOriginalImagePromise = s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: originalImageKey,
        Body: originalImageBuffer,
        ContentType: contentType,
      }),
    );

    const putRoundedImagePromise = s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: roundedImageKey,
        Body: roundedImageBuffer,
        ContentType: contentType,
      }),
    );

    await Promise.all([
      putMinifiedImagePromise,
      putOriginalImagePromise,
      putRoundedImagePromise,
    ]);

    logger.info(`Successfully processed and uploaded logo images`, {
      originalImageKey,
      minimizedImageKey,
      roundedImageKey,
      width,
      height,
      cornerRadius,
    });
  } catch (error) {
    logger.error(`Failed to process logo image: ${error}`, {
      sourceKey,
      destinationFolder,
      imageKey,
      width,
      height,
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
