import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import {
  createPresignedPost,
  type PresignedPost,
} from "@aws-sdk/s3-presigned-post";

// Image-type identifier the dashboard / Hasura action / MCP all share. The
// values match the basenames the dashboard uses on disk so the existing image
// upload flow keeps working.
export const APP_IMAGE_BASENAMES = {
  logo_img: "logo_img",
  hero_image: "hero_image",
  content_card_image: "content_card_image",
  meta_tag_image: "meta_tag_image",
  showcase_img_1: "showcase_img_1",
  showcase_img_2: "showcase_img_2",
  showcase_img_3: "showcase_img_3",
} as const;

export type AppImageBasename = keyof typeof APP_IMAGE_BASENAMES;

// MCP-facing alias map: short, human-friendly image_type values that map onto
// the basenames + the app_metadata column the upload should patch.
export const MCP_APP_IMAGE_MAP = {
  logo: { basename: "logo_img", field: "logo_img_url" },
  hero: { basename: "hero_image", field: "hero_image_url" },
  content_card: {
    basename: "content_card_image",
    field: "content_card_image_url",
  },
  meta_tag: { basename: "meta_tag_image", field: "meta_tag_image_url" },
  showcase_1: {
    basename: "showcase_img_1",
    field: "showcase_img_urls",
    arrayIndex: 0,
  },
  showcase_2: {
    basename: "showcase_img_2",
    field: "showcase_img_urls",
    arrayIndex: 1,
  },
  showcase_3: {
    basename: "showcase_img_3",
    field: "showcase_img_urls",
    arrayIndex: 2,
  },
} as const;

export type McpAppImageType = keyof typeof MCP_APP_IMAGE_MAP;

export const MAX_APP_IMAGE_BYTES = 500 * 1024;

const normalizeExtension = (contentTypeEnding: string) =>
  contentTypeEnding === "jpeg" ? "jpg" : contentTypeEnding;

export const buildAppImageObjectKey = ({
  appId,
  fileName,
  locale,
}: {
  appId: string;
  fileName: string;
  locale?: string;
}) => {
  const localePrefix = locale && locale !== "en" ? `${locale}/` : "";
  return `unverified/${appId}/${localePrefix}${fileName}`;
};

const getS3Config = () => {
  const region = process.env.ASSETS_S3_REGION;
  const bucket = process.env.ASSETS_S3_BUCKET_NAME;
  if (!region) {
    throw new Error("ASSETS_S3_REGION is not configured.");
  }
  if (!bucket) {
    throw new Error("ASSETS_S3_BUCKET_NAME is not configured.");
  }
  return { region, bucket };
};

/**
 * Generate a presigned multipart POST that callers can use to upload directly
 * to S3 from the browser (or any client). Used by the Hasura upload-image
 * action. Mirrors the dashboard's upload contract.
 */
export const generateAppImagePresignedPost = async ({
  appId,
  imageType,
  contentTypeEnding,
  locale,
}: {
  appId: string;
  imageType: string;
  contentTypeEnding: string;
  locale?: string;
}): Promise<PresignedPost> => {
  const { region, bucket } = getS3Config();
  const client = new S3Client({ region });
  const ext = normalizeExtension(contentTypeEnding);
  const fileName = `${imageType}.${ext}`;
  const objectKey = buildAppImageObjectKey({ appId, fileName, locale });
  const contentType = `image/${contentTypeEnding}`;
  return createPresignedPost(client, {
    Bucket: bucket,
    Key: objectKey,
    Expires: 600, // 10 minutes
    Conditions: [
      ["content-length-range", 0, MAX_APP_IMAGE_BYTES],
      ["eq", "$Content-Type", contentType],
    ],
  });
};

/**
 * Upload an image directly from the server (used by the MCP upload_app_image
 * tool). Returns the resulting object key + filename so the caller can patch
 * the matching app_metadata field.
 */
export const uploadAppImage = async ({
  appId,
  imageType,
  body,
  contentType,
  locale,
}: {
  appId: string;
  imageType: McpAppImageType;
  body: Buffer;
  contentType: "image/png" | "image/jpeg";
  locale?: string;
}) => {
  if (body.byteLength === 0) {
    throw new Error("Image is empty.");
  }
  if (body.byteLength > MAX_APP_IMAGE_BYTES) {
    throw new Error(
      `Image is ${body.byteLength} bytes; maximum is ${MAX_APP_IMAGE_BYTES} (500KB).`,
    );
  }

  const { region, bucket } = getS3Config();
  const client = new S3Client({ region });
  const ext = contentType === "image/png" ? "png" : "jpg";
  const mapping = MCP_APP_IMAGE_MAP[imageType];
  const fileName = `${mapping.basename}.${ext}`;
  const objectKey = buildAppImageObjectKey({ appId, fileName, locale });

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      Body: body,
      ContentType: contentType,
    }),
  );

  return { fileName, objectKey, mapping, sizeBytes: body.byteLength };
};
