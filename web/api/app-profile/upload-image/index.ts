import { getSdk as checkUserInAppDocumentSDK } from "@/api/app-profile/graphql/checkUserInApp.generated";
import { errorHasuraQuery } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { protectInternalEndpoint } from "@/api/helpers/utils";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { logger } from "@/lib/logger";
import { S3Client } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";

const schema = yup.object({
  app_id: yup.string().strict().required(),
  image_type: yup.string().strict().required(),
  content_type_ending: yup.string().required(),
});

export const POST = async (req: NextRequest) => {
  try {
    if (!protectInternalEndpoint(req)) {
      return;
    }

    const body = await req.json();
    if (body?.action.name !== "upload_image") {
      return errorHasuraQuery({
        req,
        detail: "Invalid action.",
        code: "invalid_action",
      });
    }

    const userId = body.session_variables["x-hasura-user-id"];
    if (!userId) {
      return errorHasuraQuery({
        req,
        detail: "userId must be set.",
        code: "required",
      });
    }

    const teamId = body.input.team_id;

    if (!teamId) {
      return errorHasuraQuery({
        req,
        detail: "teamId must be set.",
        code: "required",
      });
    }

    const { isValid, parsedParams } = await validateRequestSchema({
      value: Object.fromEntries(req.nextUrl.searchParams),
      schema,
    });

    if (!isValid || !parsedParams) {
      return errorHasuraQuery({
        req,
        detail: "Invalid request params.",
        code: "invalid_request",
      });
    }

    const { app_id, image_type, content_type_ending } = parsedParams;

    if (!["png", "jpeg"].includes(content_type_ending)) {
      return errorHasuraQuery({
        req,
        detail: "Content Type is invalid",
        code: "invalid_input",
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

    // Admins and Owners allowed to upload images
    if (userTeam.length === 0) {
      return errorHasuraQuery({
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

    return NextResponse.json({
      url: url,
      stringifiedFields: JSON.stringify(fields),
    });
  } catch (error) {
    logger.error("Error uploading image.", { error });

    return errorHasuraQuery({
      req,
      detail: "Unable to upload image",
      code: "internal_error",
    });
  }
};
