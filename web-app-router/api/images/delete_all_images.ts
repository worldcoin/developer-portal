import {
  errorHasuraQuery,
  errorNotAllowed,
  errorResponse,
} from "@/legacy/backend/errors";
import { NextApiRequest, NextApiResponse } from "next";
import { protectInternalEndpoint } from "@/legacy/backend/utils";
import { getAPIServiceGraphqlClient } from "@/legacy/backend/graphql";
import { getSdk as getUnverifiedImagesSDK } from "@/api/images/graphql/getUnverifiedImages.generated";
import {
  S3Client,
  ListObjectsCommand,
  PutObjectTaggingCommand,
} from "@aws-sdk/client-s3";
import { logger } from "@/lib/logger";

export type DeleteAllImagesResponse = {
  success?: boolean;
};

/**
 * TODO: Triggered when user deletes an app. Sets all unverified images to expire in 3 days.
 * @param req
 * @param res
 */
export const handleDeleteAllImages = async (
  req: NextApiRequest,
  res: NextApiResponse,
) => {
  throw new Error("Not implemented yet.");

  // try {
  //   if (!protectInternalEndpoint(req, res)) {
  //     return;
  //   }

  //   if (req.method !== "POST") {
  //     return errorNotAllowed(req.method!, res, req);
  //   }

  //   if (req.body.action?.name !== "delete_unverified_images") {
  //     return errorHasuraQuery({
  //       res,
  //       req,
  //       detail: "Invalid action.",
  //       code: "invalid_action",
  //     });
  //   }

  //   // TODO: If Hasura is calling this as a trigger on app deletion, these permissions checks should be removed
  //   const userId = req.body.session_variables["x-hasura-user-id"];
  //   if (!userId) {
  //     return errorHasuraQuery({
  //       res,
  //       req,
  //       detail: "userId must be set.",
  //       code: "required",
  //     });
  //   }

  //   const teamId = req.body.session_variables["x-hasura-team-id"];
  //   if (!teamId) {
  //     return errorHasuraQuery({
  //       res,
  //       req,
  //       detail: "teamId must be set.",
  //       code: "required",
  //     });
  //   }
  //   const app_id = req.body.input.app_id;
  //   if (!app_id) {
  //     return errorHasuraQuery({
  //       res,
  //       req,
  //       detail: "app_id must be set.",
  //       code: "required",
  //     });
  //   }
  //   const client = await getAPIServiceGraphqlClient();
  //   const { app: appInfo } = await getUnverifiedImagesSDK(
  //     client
  //   ).GetUnverifiedImages({
  //     team_id: teamId,
  //     app_id: app_id as string,
  //     user_id: userId,
  //   });
  //   const userMembership = appInfo[0].team.memberships.find(
  //     (membership) => membership.user_id === userId
  //   );
  //   // There should only be one app with the matching app_id and team_id
  //   // Only Owner is allowed to delete
  //   if (
  //     appInfo.length === 0 ||
  //     appInfo[0]?.app_metadata.length === 0 ||
  //     !userMembership ||
  //     userMembership.role !== "OWNER"
  //   ) {
  //     return errorHasuraQuery({
  //       res,
  //       req,
  //       detail: "App not found.",
  //       code: "not_found",
  //     });
  //   }

  //   const s3Client = new S3Client({
  //     region: process.env.ASSETS_S3_REGION,
  //   });
  //   if (!process.env.ASSETS_S3_BUCKET_NAME) {
  //     throw new Error("AWS Bucket Name must be set.");
  //   }
  //   const bucketName = process.env.ASSETS_S3_BUCKET_NAME;
  //   const objectPrefix = `unverified/${app_id}/`;

  //   const listObjectsResponse = await s3Client.send(
  //     new ListObjectsCommand({
  //       Bucket: bucketName,
  //       Prefix: objectPrefix,
  //     })
  //   );

  //   const objectKeys = listObjectsResponse.Contents?.map(
  //     (object) => object.Key
  //   );

  //   if (objectKeys && objectKeys.length > 0) {
  //     const expirePromises = objectKeys.map((key) =>
  //       s3Client.send(
  //         new PutObjectTaggingCommand({
  //           Bucket: bucketName,
  //           Key: key,
  //           Tagging: {
  //             TagSet: [
  //               {
  //                 Key: "expired",
  //                 Value: "true",
  //               },
  //             ],
  //           },
  //         })
  //       )
  //     );
  //     await Promise.all(expirePromises);
  //   }
  //   res.status(200).json({
  //     success: true,
  //   });
  // } catch (error) {
  //   logger.error("Error deleting images.", { error });
  //   return errorResponse(
  //     res,
  //     500,
  //     "internal_server_error",
  //     "Unable to delete images",
  //     null,
  //     req
  //   );
  // }
};
