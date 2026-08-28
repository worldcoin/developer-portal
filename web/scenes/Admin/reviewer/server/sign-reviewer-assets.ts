import "server-only";

import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import {
  buildReviewerAssetDescriptors,
  resolveReviewerSubmissionAssetKey,
} from "@/api/helpers/reviewer-submission-assets";
import type { ReviewerAsset } from "../types";

const SIGNED_URL_TTL_SECONDS = 15 * 60;

export const signReviewerSubmissionAssets = async (input: {
  appId: string;
  appMetadataId: string;
  assetSnapshot: unknown;
  metadataSnapshot: Record<string, unknown>;
  localizationsSnapshot: Array<Record<string, unknown>>;
}): Promise<ReviewerAsset[]> => {
  const region = process.env.ASSETS_S3_REGION;
  const bucket = process.env.ASSETS_S3_BUCKET_NAME;
  if (!region || !bucket)
    throw new Error("Reviewer asset signing is not configured");

  const client = new S3Client({ region });
  const descriptors = buildReviewerAssetDescriptors(input);
  return Promise.all(
    descriptors.map(async ({ key, ...descriptor }) => ({
      ...descriptor,
      signedUrl: await getSignedUrl(
        client,
        new GetObjectCommand({
          Bucket: bucket,
          Key: resolveReviewerSubmissionAssetKey({
            appId: input.appId,
            appMetadataId: input.appMetadataId,
            assetSnapshot: input.assetSnapshot,
            sourceKey: key,
          }),
        }),
        { expiresIn: SIGNED_URL_TTL_SECONDS },
      ),
    })),
  );
};
