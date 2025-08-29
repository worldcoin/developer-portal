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
 * @param destinationKey - The destination key for the resized image
 * @param width - Target width for resizing
 * @param height - Target height for resizing
 * @param fileExtension - The file extension (png, jpg, jpeg) to determine output format
 * @returns Promise<void>
 */
export const resizeAndUploadImage = async (
  s3Client: S3Client,
  bucketName: string,
  sourceKey: string,
  destinationKey: string,
  width: number,
  height: number,
  fileExtension: string,
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

    let outputBuffer: Buffer;
    let contentType: string;
    const normalizedExtension = fileExtension.toLowerCase();

    if (normalizedExtension === "png") {
      outputBuffer = await sharp(imageBuffer)
        .resize(width, height, {
          fit: "cover",
          position: "center",
        })
        .png()
        .toBuffer();
      contentType = "image/png";
    } else {
      outputBuffer = await sharp(imageBuffer)
        .resize(width, height, {
          fit: "cover",
          position: "center",
        })
        .jpeg({ quality: 100 })
        .toBuffer();
      contentType = "image/jpeg";
    }

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: destinationKey,
        Body: outputBuffer,
        ContentType: contentType,
      }),
    );

    logger.info(`Successfully resized and uploaded image: ${destinationKey}`, {
      fileExtension,
      outputFormat: normalizedExtension === "png" ? "png" : "jpeg",
    });
  } catch (error) {
    logger.error(`Failed to resize and upload image: ${error}`, {
      sourceKey,
      destinationKey,
      width,
      height,
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
