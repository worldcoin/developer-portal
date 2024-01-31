import {
  errorHasuraQuery,
  errorNotAllowed,
  errorResponse,
} from "src/backend/errors";
import { NextApiRequest, NextApiResponse } from "next";
import { protectInternalEndpoint } from "src/backend/utils";
import { getAPIReviewerGraphqlClient } from "src/backend/graphql";
import { getSdk as getAppMetadataSDK } from "@/api/images/graphql/getAppMetadata.generated";
import { getSdk as deleteVerifiedAppMetadataSDK } from "@/api/images/graphql/deleteVerifiedAppMetadata.generated";
import { getSdk as updateAppMetadataSDK } from "@/api/images/graphql/updateAppMetadata.generated";
import { getFileExtension } from "src/backend/utils";

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

/**
 * This function handles the verification of the app by a reviewer
 * @param req Expects an app_id and reviewer_name is_reviewer_app_store_approved and is_reviewer_world_app_approved
 * @param res Returns a success message if the app was verified
 */
export const handleVerifyApp = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  try {
    if (!protectInternalEndpoint(req, res)) {
      return;
    }

    if (req.method !== "POST") {
      return errorNotAllowed(req.method!, res, req);
    }

    // Do we want admin to be able to run this?
    if (
      !["reviewer", "admin"].includes(
        req.body.session_variables["x-hasura-role"]
      )
    ) {
      return errorHasuraQuery({
        res,
        req,
        detail: "Only reviewers are allowed to verify apps.",
        code: "required",
      });
    }

    if (req.body.action?.name !== "verify_app") {
      return errorHasuraQuery({
        res,
        req,
        detail: "Invalid action.",
        code: "invalid_action",
      });
    }

    const {
      app_id,
      reviewer_name,
      is_reviewer_app_store_approved,
      is_reviewer_world_app_approved,
    } = req.body.input;

    if (
      !app_id ||
      !reviewer_name ||
      typeof is_reviewer_app_store_approved !== "boolean" ||
      typeof is_reviewer_world_app_approved !== "boolean"
    ) {
      return errorHasuraQuery({
        res,
        req,
        detail:
          "app_id, reviewer_name, is_reviewer_app_store_approved,is_reviewer_world_app_approved must be set.",
        code: "required",
      });
    }

    const reviewer_client = await getAPIReviewerGraphqlClient();
    const { app: appMetadata } = await getAppMetadataSDK(
      reviewer_client
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
      (metadata) => metadata.verification_status === "awaiting_review"
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
      (metadata) => metadata.verification_status === "verified"
    );

    const s3Client = new S3Client({
      region: process.env.ASSETS_S3_REGION,
    });

    if (!process.env.ASSETS_S3_BUCKET_NAME) {
      throw new Error("AWS Bucket Name must be set.");
    }

    const bucketName = process.env.ASSETS_S3_BUCKET_NAME;
    const sourcePrefix = `unverified/${app_id}/`;
    const destinationPrefix = `verified/${app_id}/`;

    // Mark for deletion existing verified images
    const listObjectsResponse = await s3Client.send(
      new ListObjectsCommand({
        Bucket: bucketName,
        Prefix: destinationPrefix,
      })
    );

    const verifiedImageKeysToDelete = listObjectsResponse.Contents?.map(
      (object) => object.Key
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
          })
        )
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
        })
      )
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
        })
      )
    );

    const showcaseImgUrls = awaitingReviewAppMetadata.showcase_img_urls;
    const showcaseFileTypes = showcaseImgUrls.map((url: string) =>
      getFileExtension(url)
    );
    const showcaseImgUUIDs = showcaseImgUrls.map(
      (_: string, index: number) => randomUUID() + showcaseFileTypes[index]
    );
    const showcaseCopyPromises = showcaseImgUrls.map(
      (key: string, index: number) => {
        return s3Client.send(
          new CopyObjectCommand({
            Bucket: bucketName,
            CopySource: `${bucketName}/${sourcePrefix}${key}`,
            Key: `${destinationPrefix}${showcaseImgUUIDs[index]}`,
          })
        );
      }
    );
    copyPromises.push(...showcaseCopyPromises);
    await Promise.all(copyPromises);

    // Delete an existing verified rows
    if (verifiedAppMetadata) {
      const deleteVerifiedAppMetadata = await deleteVerifiedAppMetadataSDK(
        reviewer_client
      ).DeleteVerifiedAppMetadata({
        id: verifiedAppMetadata.id,
      });
      if (!deleteVerifiedAppMetadata) {
        return errorHasuraQuery({
          res,
          req,
          detail: "Unable to delete existing verified data.",
          code: "delete_failed",
        });
      }
    }

    // Update app metadata unverified to reflect new verified images, change verification_status to verified, verified_at, reviewed_by etc.
    const stringifiedShowcaseImgUrls = `{${showcaseImgUUIDs
      .map((url: string) => `"${url}"`)
      .join(",")}}`;

    const updateAppMetadata = await updateAppMetadataSDK(
      reviewer_client
    ).UpdateAppMetadata({
      id: awaitingReviewAppMetadata.id,
      verified_data_changes: {
        logo_img_url: newLogoImgName,
        hero_image_url: newHeroImgName,
        showcase_img_urls: stringifiedShowcaseImgUrls,
        verification_status: "verified",
        verified_at: new Date().toISOString(),
        reviewed_by: reviewer_name,
        is_reviewer_app_store_approved: true,
        is_reviewer_world_app_approved: true,
      },
    });

    if (!updateAppMetadata) {
      return errorHasuraQuery({
        res,
        req,
        detail: "Unable to update app metadata.",
        code: "verification_failed",
      });
    }

    res.status(200).json({
      success: true,
    });
  } catch (error) {
    logger.error("Error verifying app.", { error });
    return errorResponse(
      res,
      500,
      "internal_server_error",
      "Unable to verify app",
      null,
      req
    );
  }
};
