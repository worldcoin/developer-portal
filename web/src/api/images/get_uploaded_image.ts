import {
  errorHasuraQuery,
  errorNotAllowed,
  errorResponse,
} from "src/backend/errors";
import { NextApiRequest, NextApiResponse } from "next";
import * as yup from "yup";
import { protectInternalEndpoint } from "src/backend/utils";
import { getAPIServiceGraphqlClient } from "src/backend/graphql";
import { getSdk as checkUserInAppDocumentSDK } from "@/api/images/graphql/checkUserInApp.generated";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { logger } from "@/lib/logger";

const schema = yup.object({
  app_id: yup.string().strict().required(),
  image_type: yup
    .string()
    .strict()
    .oneOf([
      "logo_img",
      "hero_image",
      "showcase_img_1",
      "showcase_img_2",
      "showcase_img_3",
    ])
    .required(),
  content_type_ending: yup.string().strict().oneOf(["png", "jpeg"]).required(),
});

// This endpoint takes in an appID and image and returns that particular image
export const handleImageGet = async (
  req: NextApiRequest,
  res: NextApiResponse
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

    const validatedInput = await schema.validate(req.query);
    const { app_id, image_type, content_type_ending } = validatedInput;

    const client = await getAPIServiceGraphqlClient();

    if (body.session_variables["x-hasura-role"] === "admin") {
      return errorHasuraQuery({
        res,
        req,
        detail: "Admin is not allowed to run this query.",
        code: "admin_not_allowed",
      });
    }
    const { team: userTeam } = await checkUserInAppDocumentSDK(
      client
    ).CheckUserInApp({
      team_id: body.session_variables["x-hasura-team-id"],
      app_id: app_id,
      user_id: body.session_variables["x-hasura-user-id"],
    });
    if (
      !userTeam[0].apps.some((app) => app.id === app_id) ||
      userTeam[0].users.length === 0
    ) {
      return errorHasuraQuery({
        res,
        req,
        detail: "User does not have access to this app.",
        code: "no_access",
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
      req
    );
  }
};
