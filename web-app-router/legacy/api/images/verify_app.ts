import { errorHasuraQuery, errorNotAllowed } from "@/legacy/backend/errors";
import { NextApiRequest, NextApiResponse } from "next";
import { protectInternalEndpoint } from "@/legacy/backend/utils";
import { getAPIReviewerGraphqlClient } from "@/legacy/backend/graphql";
import { getSdk as getAppMetadataSDK } from "@/legacy/api/images/graphql/getAppMetadata.generated";
import { getSdk as verifyAppSDK } from "@/legacy/api/images/graphql/verifyApp.generated";
import { getFileExtension } from "@/legacy/backend/utils";
import * as yup from "yup";
import { validateRequestSchema } from "@/legacy/backend/utils";

import {
  S3Client,
  ListObjectsCommand,
  PutObjectTaggingCommand,
  CopyObjectCommand,
} from "@aws-sdk/client-s3";
import { logger } from "@/lib/logger";
import { randomUUID } from "crypto";

export type VerifyAppResponse = {
  success?: boolean;
};

const schema = yup.object({
  app_id: yup.string().strict().required(),
  reviewer_name: yup.string().strict().required(),
  is_reviewer_app_store_approved: yup.boolean().required(),
  is_reviewer_world_app_approved: yup.boolean().required(),
});

// TODO: This should be converted to an Async Worker.

/**
 * This function handles the verification of the app by a reviewer
 * @param req Expects an app_id and reviewer_name is_reviewer_app_store_approved and is_reviewer_world_app_approved
 * @param res Returns a success message if the app was verified
 */
export const handleVerifyApp = async (
  req: NextApiRequest,
  res: NextApiResponse,
) => {
  if (!process.env.ASSETS_S3_BUCKET_NAME) {
    logger.error("AWS Bucket Name is not set.");
    return errorHasuraQuery({ req, res });
  }

  if (!protectInternalEndpoint(req, res)) {
    return;
  }

  if (req.method !== "POST") {
    return errorNotAllowed(req.method!, res, req);
  }

  if (
    !["reviewer", "admin"].includes(req.body.session_variables["x-hasura-role"])
  ) {
    logger.error("Unauthorized access."),
      { role: req.body.session_variables["x-hasura-role"] };
    return errorHasuraQuery({ res, req });
  }

  if (req.body.action?.name !== "verify_app") {
    return errorHasuraQuery({
      res,
      req,
      detail: "Invalid action.",
      code: "invalid_action",
    });
  }

  const { isValid, parsedParams } = await validateRequestSchema({
    value: req.body.input,
    schema,
  });

  if (!isValid || !parsedParams) {
    return errorHasuraQuery({
      req,
      res,
      detail: "Invalid request body.",
      code: "invalid_request",
    });
  }

  const {
    app_id,
    reviewer_name,
    is_reviewer_app_store_approved,
    is_reviewer_world_app_approved,
  } = parsedParams;

  const reviewer_client = await getAPIReviewerGraphqlClient();
  const { app: appMetadata } = await getAppMetadataSDK(
    reviewer_client,
  ).GetAppMetadata({
    app_id: app_id as string,
  });

  const app = appMetadata[0];
  if (!app) {
    return errorHasuraQuery({
      res,
      req,
      detail: "App not found.",
      code: "not_found",
    });
  }

  const awaitingReviewAppMetadata = app.app_metadata.find(
    (metadata) => metadata.verification_status === "awaiting_review",
  );

  if (!awaitingReviewAppMetadata) {
    return errorHasuraQuery({
      res,
      req,
      detail: "No app awaiting review.",
      code: "invalid_verification_status",
    });
  }

  const verifiedAppMetadata = app.app_metadata.find(
    (metadata) => metadata.verification_status === "verified",
  );

  const s3Client = new S3Client({
    region: process.env.ASSETS_S3_REGION,
  });

  const bucketName = process.env.ASSETS_S3_BUCKET_NAME;
  const sourcePrefix = `unverified/${app_id}/`;
  const destinationPrefix = `verified/${app_id}/`;

  // In case we have some stale images in the folder we iterate directly to delete
  const listObjectsResponse = await s3Client.send(
    new ListObjectsCommand({
      Bucket: bucketName,
      Prefix: destinationPrefix,
    }),
  );

  const verifiedImageKeysToDelete = listObjectsResponse.Contents?.map(
    (object) => object.Key,
  );

  if (verifiedImageKeysToDelete && verifiedImageKeysToDelete.length > 0) {
    const expirePromises = verifiedImageKeysToDelete.map((key) =>
      s3Client.send(
        new PutObjectTaggingCommand({
          Bucket: bucketName,
          Key: key,
          Tagging: {
            TagSet: [
              {
                Key: "expired",
                Value: "true",
              },
            ],
          },
        }),
      ),
    );
    await Promise.all(expirePromises);
  }

  // Copy unverified images to verified images with random names
  const copyPromises = [];

  const currentLogoImgName = awaitingReviewAppMetadata.logo_img_url;
  const logoFileType = getFileExtension(currentLogoImgName);
  const newLogoImgName = randomUUID() + logoFileType;
  copyPromises.push(
    s3Client.send(
      new CopyObjectCommand({
        Bucket: bucketName,
        CopySource: `${bucketName}/${sourcePrefix}${currentLogoImgName}`,
        Key: `${destinationPrefix}${newLogoImgName}`,
      }),
    ),
  );

  const currentHeroImgName = awaitingReviewAppMetadata.hero_image_url;
  const heroFileType = getFileExtension(currentHeroImgName);
  const newHeroImgName = randomUUID() + heroFileType;
  copyPromises.push(
    s3Client.send(
      new CopyObjectCommand({
        Bucket: bucketName,
        CopySource: `${bucketName}/${sourcePrefix}${currentHeroImgName}`,
        Key: `${destinationPrefix}${newHeroImgName}`,
      }),
    ),
  );

  const showcaseImgUrls = awaitingReviewAppMetadata.showcase_img_urls;
  const showcaseFileTypes = showcaseImgUrls.map((url: string) =>
    getFileExtension(url),
  );
  const showcaseImgUUIDs = showcaseImgUrls.map(
    (_: string, index: number) => randomUUID() + showcaseFileTypes[index],
  );
  const showcaseCopyPromises = showcaseImgUrls.map(
    (key: string, index: number) => {
      return s3Client.send(
        new CopyObjectCommand({
          Bucket: bucketName,
          CopySource: `${bucketName}/${sourcePrefix}${key}`,
          Key: `${destinationPrefix}${showcaseImgUUIDs[index]}`,
        }),
      );
    },
  );
  copyPromises.push(...showcaseCopyPromises);
  await Promise.all(copyPromises);

  // Update app metadata unverified to reflect new verified images, change verification_status to verified, verified_at, reviewed_by etc.
  const stringifiedShowcaseImgUrls = `{${showcaseImgUUIDs
    .map((url: string) => `"${url}"`)
    .join(",")}}`;

  const updateAppMetadata = await verifyAppSDK(reviewer_client).verifyApp({
    idToVerify: awaitingReviewAppMetadata.id,
    idToDelete: verifiedAppMetadata ? verifiedAppMetadata?.id : "", // No app has id "" so this will delete nothing
    verified_data_changes: {
      logo_img_url: newLogoImgName,
      hero_image_url: newHeroImgName,
      showcase_img_urls: stringifiedShowcaseImgUrls,
      verification_status: "verified",
      verified_at: new Date().toISOString(),
      reviewed_by: reviewer_name,
      is_reviewer_app_store_approved: is_reviewer_app_store_approved,
      is_reviewer_world_app_approved: is_reviewer_world_app_approved,
    },
  });

  if (!updateAppMetadata) {
    return errorHasuraQuery({
      res,
      req,
      detail: "Unable to verify.",
      code: "verification_failed",
    });
  }

  res.status(200).json({
    success: true,
  });
};
