import "dotenv/config";

import {
  CreateBucketCommand,
  ListBucketsCommand,
  PutBucketCorsCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const endpoint = process.env.AWS_ENDPOINT_URL_S3?.trim();
if (!endpoint) {
  throw new Error("AWS_ENDPOINT_URL_S3 is required to set up local S3.");
}

if (!process.env.AWS_PROFILE) {
  process.env.AWS_ACCESS_KEY_ID ??= "test";
  process.env.AWS_SECRET_ACCESS_KEY ??= "test";
}

const bucket = process.env.ASSETS_S3_BUCKET_NAME || "developer-portal-assets";
const s3 = new S3Client({
  region: process.env.ASSETS_S3_REGION || "us-east-1",
  endpoint,
  forcePathStyle: true,
});

const sleep = (durationMs) =>
  new Promise((resolve) => setTimeout(resolve, durationMs));

async function waitForS3() {
  const deadline = Date.now() + 60_000;
  let lastError;

  while (Date.now() < deadline) {
    try {
      await s3.send(new ListBucketsCommand({}));
      return;
    } catch (error) {
      lastError = error;
      await sleep(1_000);
    }
  }

  throw new Error(`S3 at '${endpoint}' was not ready within 60 seconds.`, {
    cause: lastError,
  });
}

await waitForS3();

try {
  await s3.send(new CreateBucketCommand({ Bucket: bucket }));
} catch (error) {
  if (error?.name !== "BucketAlreadyOwnedByYou") throw error;
}

await s3.send(
  new PutBucketCorsCommand({
    Bucket: bucket,
    CORSConfiguration: {
      CORSRules: [
        {
          AllowedHeaders: ["*"],
          AllowedMethods: ["GET", "HEAD", "POST", "PUT", "DELETE"],
          AllowedOrigins: ["http://localhost:3000"],
          ExposeHeaders: ["ETag"],
        },
      ],
    },
  }),
);

console.log(`LocalStack S3 bucket '${bucket}' is ready.`);
