import {
  errorHasuraQuery,
  errorNotAllowed,
  errorResponse,
} from "@/legacy/backend/errors";
import { NextApiRequest, NextApiResponse } from "next";
import { protectInternalEndpoint } from "@/legacy/backend/utils";
import { getAPIServiceGraphqlClient } from "@/legacy/backend/graphql";
import { getSdk as checkUserInAppDocumentSDK } from "@/legacy/api/images/graphql/checkUserInApp.generated";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { logger } from "@/lib/logger";

type RequestQueryParams = {
  app_id: string;
  image_type: string;
  content_type_ending: string;
};

/**
 * Returns a single signed url to get the recently uploaded image from S3
 * @param req
 * @param res
 */
export const handleGetUploadedImage = async (
  req: NextApiRequest,
  res: NextApiResponse,
) => {
  try {
    if (!protectInternalEndpoint(req, res)) {
      return;
    }

    if (!req.method || req.method !== "GET") {
      return errorNotAllowed(req.method, res, req);
    }

    const body = JSON.parse(req.body);
    if (body?.action.name !== "get_uploaded_image") {
      return errorHasuraQuery({
        res,
        req,
        detail: "Invalid action.",
        code: "invalid_action",
      });
    }

    const userId = body.session_variables["x-hasura-user-id"];
    if (!userId) {
      return errorHasuraQuery({
        res,
        req,
        detail: "userId must be set.",
        code: "required",
      });
    }

    const teamId = body.session_variables["x-hasura-team-id"];
    if (!teamId) {
      return errorHasuraQuery({
        res,
        req,
        detail: "teamId must be set.",
        code: "required",
      });
    }
    const { app_id, image_type, content_type_ending } =
      req.query as RequestQueryParams;
    if (!app_id || !image_type || !content_type_ending) {
      return errorHasuraQuery({
        res,
        req,
        detail: "app_id, image_type, and content_type_ending must be set.",
        code: "required",
      });
    }
    const client = await getAPIServiceGraphqlClient();

    const { team: userTeam } = await checkUserInAppDocumentSDK(
      client,
    ).CheckUserInApp({
      team_id: teamId,
      app_id: app_id,
      user_id: userId,
    });

    // Admin and Owner allowed to view uploaded images. Not relevant for Member.
    if (userTeam.length === 0) {
      return errorHasuraQuery({
        res,
        req,
        detail: "App not found.",
        code: "not_found",
      });
    }
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
    const objectKey = `unverified/${app_id}/${image_type}.${
      content_type_ending === "jpeg" ? "jpg" : content_type_ending
    }`;
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    });
    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 900, // The URL will expire in 15 minutes
    });

    res.status(200).json({
      url: signedUrl,
    });
  } catch (error) {
    logger.error("Error getting uploaded image.", { error });
    return errorResponse(
      res,
      500,
      "internal_server_error",
      "Unable to get uploaded image",
      null,
      req,
    );
  }
};
