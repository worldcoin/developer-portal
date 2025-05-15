import { getSdk as checkUserInAppDocumentSDK } from "@/api/hasura/graphql/checkUserInApp.generated";
import { errorHasuraQuery } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { protectInternalEndpoint } from "@/api/helpers/utils";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { logger } from "@/lib/logger";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";

const schema = yup.object({
  app_id: yup.string().strict().required(),
  image_type: yup.string().strict().required(),
  content_type_ending: yup.string().required(),
  locale: yup.string(),
});

/**
 * Returns a single signed url to get the recently uploaded image from S3
 * @param req
 * @param res
 */

export const POST = async (req: NextRequest) => {
  let app_id: string | undefined;
  let team_id: string | undefined;

  try {
    if (!protectInternalEndpoint(req)) {
      return;
    }

    const body = await req.json();
    if (body?.action.name !== "get_uploaded_image") {
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

    team_id = body.input.team_id;

    if (!team_id) {
      return errorHasuraQuery({
        req,
        detail: "team_id must be set.",
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
        detail: "Invalid request body.",
        code: "invalid_request",
        team_id,
      });
    }

    const { image_type, content_type_ending, locale } = parsedParams;
    app_id = parsedParams.app_id;

    const client = await getAPIServiceGraphqlClient();

    const { team: userTeam } = await checkUserInAppDocumentSDK(
      client,
    ).CheckUserInApp({
      team_id,
      app_id,
      user_id: userId,
    });

    // Admin and Owner allowed to view uploaded images. Not relevant for Member.
    if (userTeam.length === 0) {
      return errorHasuraQuery({
        req,
        detail: "App not found.",
        code: "not_found",
        team_id,
        app_id,
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
    const objectKey = `unverified/${app_id}${locale && locale !== "en" ? `/${locale}` : ""}/${image_type}.${
      content_type_ending === "jpeg" ? "jpg" : content_type_ending
    }`;

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    });

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 900, // The URL will expire in 15 minutes
    });

    return NextResponse.json({ url: signedUrl });
  } catch (error) {
    logger.error("Error getting images.", { error, app_id, team_id });

    return errorHasuraQuery({
      req,
      detail: "Unable to get image",
      code: "internal_error",
      team_id,
      app_id,
    });
  }
};
