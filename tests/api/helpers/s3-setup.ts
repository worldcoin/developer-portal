import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

// Helper to create test files in S3
export const createTestS3Files = async (
  bucketName: string,
  appId: string,
  files: string[],
) => {
  const s3Client = new S3Client({
    region: process.env.ASSETS_S3_REGION || "us-east-1",
  });

  const uploadPromises = files.map((fileName) => {
    const key = `unverified/${appId}/${fileName}`;
    // Create a simple PNG-like content for testing
    const testContent = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
      "base64",
    );

    return s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: testContent,
        ContentType: "image/png",
      }),
    );
  });

  await Promise.all(uploadPromises);
  console.log(`Created test files in S3 for app ${appId}:`, files);
};

// Helper to clean up test files from S3
export const cleanupTestS3Files = async (
  bucketName: string,
  appId: string,
  files: string[],
) => {
  const s3Client = new S3Client({
    region: process.env.ASSETS_S3_REGION || "us-east-1",
  });

  const deletePromises = files.map((fileName) => {
    const key = `unverified/${appId}/${fileName}`;

    return s3Client
      .send(
        new DeleteObjectCommand({
          Bucket: bucketName,
          Key: key,
        }),
      )
      .catch((error) => {
        console.warn(`Failed to delete ${key}:`, error.message);
      });
  });

  await Promise.all(deletePromises);
};
