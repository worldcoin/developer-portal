import { errorHasuraQuery, errorNotAllowed } from "@/legacy/backend/errors";
import { NextApiRequest, NextApiResponse } from "next";
import { getAPIServiceGraphqlClient } from "@/legacy/backend/graphql";
import { getSdk as checkUserInAppDocumentSDK } from "@/legacy/api/images/graphql/checkUserInApp.generated";
import { S3Client } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { logger } from "@/lib/logger";
import { protectInternalEndpoint } from "@/legacy/backend/utils";

type RequestQueryParams = {
  app_id: string;
  image_type: string;
  content_type_ending: string;
};

/**
 * Returns a signed url to upload to the predefined path in S3
 * @param req
 * @param res
 */
export const handleImageUpload = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  try {
    if (!protectInternalEndpoint(req, res)) {
      return;
    }

    if (req.method !== "GET") {
      return errorNotAllowed(req.method, res, req);
    }
    const body = JSON.parse(req.body);
    if (body?.action.name !== "upload_image") {
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

    // TODO: Use yup to validate input
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
    // Check that content_type_ending is png or jpeg
    if (!["png", "jpeg"].includes(content_type_ending)) {
      return errorHasuraQuery({
        res,
        req,
        detail: "Content Type is invalid",
        code: "invalid_input",
      });
    }
    const client = await getAPIServiceGraphqlClient();

    const { team: userTeam } = await checkUserInAppDocumentSDK(
      client
    ).CheckUserInApp({
      team_id: teamId,
      app_id: app_id,
      user_id: userId,
    });

    // Admins and Owners allowed to upload images
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
    // Standardize JPEG to jpg
    const objectKey = `unverified/${app_id}/${image_type}.${
      content_type_ending === "jpeg" ? "jpg" : content_type_ending
    }`;
    const contentType = `image/${content_type_ending}`;
    const signedUrl = await createPresignedPost(s3Client, {
      Bucket: bucketName,
      Key: objectKey,
      Expires: 600, // URL expires in 10 minutes
      Conditions: [
        ["content-length-range", 0, 250000], // 250 kb max file size
        ["eq", "$Content-Type", contentType],
      ],
    });
    const { url, fields } = signedUrl;
    res.status(200).json({
      url,
      stringifiedFields: JSON.stringify(fields),
    });
  } catch (error: any) {
    logger.error("Error uploading image.", { error });
    return errorHasuraQuery({
      res,
      req,
      detail: "Unable to upload image",
      code: "internal_server_error",
    });
  }
};
