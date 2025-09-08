import { getSdk as getUnverifiedImagesSDK } from "@/api/hasura/get-unverified-images/graphql/getUnverifiedImages.generated";
import { errorHasuraQuery } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { protectInternalEndpoint } from "@/api/helpers/utils";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { logger } from "@/lib/logger";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";

const schema = yup
  .object({
    app_id: yup.string().strict().required(),
    locale: yup.string(),
  })
  .noUnknown();

export const POST = async (req: NextRequest) => {
  let app_id: string | undefined;
  let team_id: string | undefined;

  try {
    const { isAuthenticated, errorResponse } = protectInternalEndpoint(req);
    if (!isAuthenticated) {
      return errorResponse;
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

    const { locale } = parsedParams;
    app_id = parsedParams.app_id;

    if (!app_id) {
      return errorHasuraQuery({
        req,
        detail: "app_id must be set.",
        code: "required",
        team_id,
      });
    }

    const client = await getAPIServiceGraphqlClient();
    const { app: appInfo } = await getUnverifiedImagesSDK(
      client,
    ).GetUnverifiedImages({
      team_id,
      app_id,
      user_id: userId,
      locale: locale || "en",
    });

    // All roles can view the unverified images awaiting review.
    if (appInfo.length === 0 || appInfo[0].app_metadata.length === 0) {
      return errorHasuraQuery({
        req,
        detail: "App not found",
        code: "not_found",
        team_id,
        app_id,
      });
    }

    const app = appInfo[0].app_metadata[0];
    const localisation =
      (locale && locale !== "en" && app.localisations?.[0]) || null;

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

    // We check for any image values that are defined in the unverified row and generate a signed URL for that image
    if (app.logo_img_url) {
      urlPromises.push(
        getSignedUrl(
          s3Client,
          new GetObjectCommand({
            Bucket: bucketName,
            Key: `${objectKey}${app.logo_img_url}`,
          }),
          { expiresIn: 7200 },
        ).then((url) => ({
          logo_img_url: url,
        })),
      );
    }

    const showcaseImgUrls = localisation
      ? localisation.showcase_img_urls
      : app.showcase_img_urls;

    if (showcaseImgUrls) {
      const showcaseUrlPromises = showcaseImgUrls.map((key: string) =>
        getSignedUrl(
          s3Client,
          new GetObjectCommand({
            Bucket: bucketName,
            Key: `${objectKey}${localisation ? `${locale}/` : ""}${key}`,
          }),
          { expiresIn: 7200 },
        ),
      );

      const showcaseUrls = await Promise.all(showcaseUrlPromises);
      urlPromises.push({ showcase_img_urls: showcaseUrls });
    } else {
      urlPromises.push({ showcase_img_urls: [] });
    }

    const metaTagImageUrl = localisation
      ? localisation.meta_tag_image_url
      : app.meta_tag_image_url;

    if (metaTagImageUrl) {
      urlPromises.push(
        getSignedUrl(
          s3Client,
          new GetObjectCommand({
            Bucket: bucketName,
            Key: `${objectKey}${localisation ? `${locale}/` : ""}${metaTagImageUrl}`,
          }),
          { expiresIn: 7200 },
        ).then((url) => ({ meta_tag_image_url: url })),
      );
    }

    if (app.content_card_image_url) {
      urlPromises.push(
        getSignedUrl(
          s3Client,
          new GetObjectCommand({
            Bucket: bucketName,
            Key: `${objectKey}${app.content_card_image_url}`,
          }),
          { expiresIn: 7200 },
        ).then((url) => ({ content_card_image_url: url })),
      );
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
    logger.error("Error getting images.", { error, app_id, team_id });
    return errorHasuraQuery({
      req,
      detail: "Unable to get images",
      code: "internal_error",
      team_id,
      app_id,
    });
  }
};
