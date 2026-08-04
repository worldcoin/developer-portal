import {
  CreateBucketCommand,
  PutBucketCorsCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const bucket = process.env.ASSETS_S3_BUCKET_NAME || "developer-portal-assets";
const s3 = new S3Client({
  region: process.env.ASSETS_S3_REGION || "us-east-1",
  endpoint: "http://localhost:4566",
  forcePathStyle: true,
  credentials: { accessKeyId: "test", secretAccessKey: "test" },
});

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
