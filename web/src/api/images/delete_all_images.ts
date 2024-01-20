import { errorHasuraQuery, errorResponse } from "src/backend/errors";
import { NextApiRequest, NextApiResponse } from "next";
import * as yup from "yup";
import {
  protectInternalEndpoint,
  validateRequestSchema,
} from "src/backend/utils";
import { getAPIServiceGraphqlClient } from "src/backend/graphql";
import { getSdk as getUnverifiedImagesSDK } from "@/api/images/graphql/getUnverifiedImages.generated";
import {
  S3Client,
  ListObjectsCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { logger } from "@/lib/logger";

export type DeleteAllImagesResponse = {
  success?: boolean;
  message?: string;
};

const schema = yup.object({
  app_id: yup.string().strict().required(),
});

// This endpoint takes in an App ID and deletes all the images in the folder. Used if the user deletes the app.
export const handleDeleteAllImages = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  try {
    if (!protectInternalEndpoint(req, res)) {
      return;
    }

    const { isValid, parsedParams, handleError } = await validateRequestSchema({
      value: req.body,
      schema,
    });

    if (!isValid || !parsedParams) {
      return handleError(req, res);
    }
    const { app_id } = parsedParams;

    const client = await getAPIServiceGraphqlClient();
    const { app: appInfo } = await getUnverifiedImagesSDK(
      client
    ).GetUnverifiedImages({
      team_id: req.body.session_variables["x-hasura-team-id"],
      app_id: app_id as string,
    });

    if (appInfo.length === 0 || appInfo[0].app_metadata.length === 0) {
      return errorHasuraQuery({
        res,
        req,
        detail: "User does not have access to this app.",
        code: "no_access",
      });
    }

    const app = appInfo[0].app_metadata[0];
    if (!process.env.ASSETS_S3_REGION) {
      throw new Error("AWS Region must be set.");
    }
    const s3Client = new S3Client({
      region: process.env.ASSETS_S3_REGION,
    });
    if (!process.env.ASSETS_S3_BUCKET_NAME) {
      throw new Error("AWS Bucket Name must be set.");
    }
    const bucketName = process.env.ASSETS_S3_BUCKET_NAME;
    const objectPrefix = `unverified/${app_id}/`;

    const listObjectsResponse = await s3Client.send(
      new ListObjectsCommand({
        Bucket: bucketName,
        Prefix: objectPrefix,
      })
    );

    const objectKeys = listObjectsResponse.Contents?.map(
      (object) => object.Key
    );

    if (objectKeys && objectKeys.length > 0) {
      const deletePromises = objectKeys.map((key) =>
        s3Client.send(
          new DeleteObjectCommand({
            Bucket: bucketName,
            Key: key,
          })
        )
      );
      await Promise.all(deletePromises);
    }
    res.status(200).json({
      success: true,
    });
  } catch (error) {
    logger.error("Error deleting images.", { error });
    return errorResponse(
      res,
      500,
      "internal_server_error",
      "Unable to delete images",
      null,
      req
    );
  }
};
