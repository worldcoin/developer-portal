import { getSdk as getUnverifiedImagesSDK } from "@/api/app-profile/get-unverified-images/graphql/getUnverifiedImages.generated";
import { errorHasuraQuery, errorNotAllowed } from "@/api/helpers/errors";
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
});

export const POST = async (req: NextRequest) => {
  try {
    if (!protectInternalEndpoint(req)) {
      return;
    }

    if (!req.method || req.method !== "POST") {
      return errorNotAllowed(req.method, req);
    }

    const body = await req.json();

    if (body?.action.name !== "get_all_unverified_images") {
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
      value: body.input,
      schema,
    });

    if (!isValid || !parsedParams) {
      return errorHasuraQuery({
        req,
        detail: "Invalid request body.",
        code: "invalid_request",
      });
    }

    const { app_id } = parsedParams;

    if (!app_id) {
      return errorHasuraQuery({
        req,
        detail: "app_id must be set.",
        code: "required",
      });
    }

    const client = await getAPIServiceGraphqlClient();
    const { app: appInfo } = await getUnverifiedImagesSDK(
      client,
    ).GetUnverifiedImages({
      team_id: teamId,
      app_id: app_id as string,
      user_id: userId,
    });

    // All roles can view the unverified images awaiting review.
    if (appInfo.length === 0 || appInfo[0].app_metadata.length === 0) {
      return errorHasuraQuery({
        req,
        detail: "App not found",
        code: "not_found",
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

    const objectKey = `unverified/${app_id}/`;
    const bucketName = process.env.ASSETS_S3_BUCKET_NAME;
    const urlPromises = [];

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: objectKey + app.logo_img_url,
    });

    // We check for any image values that are defined in the unverified row and generate a signed URL for that image
    if (app.logo_img_url) {
      urlPromises.push(
        getSignedUrl(s3Client, command, { expiresIn: 7200 }).then((url) => ({
          logo_img_url: url,
        })),
      );
    }

    if (app.hero_image_url) {
      urlPromises.push(
        getSignedUrl(
          s3Client,
          new GetObjectCommand({
            Bucket: bucketName,
            Key: objectKey + app.hero_image_url,
          }),
          { expiresIn: 7200 },
        ).then((url) => ({ hero_image_url: url })),
      );
    }

    if (app.showcase_img_urls) {
      const showcaseUrlPromises = app.showcase_img_urls.map((key) =>
        getSignedUrl(
          s3Client,
          new GetObjectCommand({
            Bucket: bucketName,
            Key: objectKey + key,
          }),
          { expiresIn: 7200 },
        ),
      );

      const showcaseUrls = await Promise.all(showcaseUrlPromises);
      urlPromises.push({ showcase_img_urls: showcaseUrls });
    } else {
      urlPromises.push({ showcase_img_urls: [] });
    }

    const signedUrls = await Promise.all(urlPromises);
    const formattedSignedUrl = signedUrls.reduce(
      (a, urlObj) => ({ ...a, ...urlObj }),
      {},
    );

    return NextResponse.json({
      ...formattedSignedUrl,
    });
  } catch (error) {
    logger.error("Error getting images.", { error });
    return errorHasuraQuery({
      req,
      detail: "Unable to get images",
      code: "internal_error",
    });
  }
};
