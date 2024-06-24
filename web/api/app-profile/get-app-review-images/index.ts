import { getSdk as getAppReviewImages } from "@/api/app-profile/get-app-review-images/graphql/getAppReviewImages.generated";
import { errorHasuraQuery, errorNotAllowed } from "@/api/helpers/errors";
import { getAPIReviewerGraphqlClient } from "@/api/helpers/graphql";
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

/**
 * Used when a reviewer is reviewing an app
 * @param req
 * @param res
 */
export const POST = async (req: NextRequest) => {
  if (!process.env.ASSETS_S3_BUCKET_NAME || !process.env.ASSETS_S3_REGION) {
    logger.error("AWS config is not set.");
    return errorHasuraQuery({
      req,
      detail: "AWS config is not set.",
      code: "invalid_config",
    });
  }
  if (!protectInternalEndpoint(req)) {
    return;
  }

  if (!req.method || req.method !== "POST") {
    return errorNotAllowed(req.method, req);
  }

  const body = await req.json();
  if (body?.action.name !== "get_app_review_images") {
    return errorHasuraQuery({
      req,
      detail: "Invalid action.",
      code: "invalid_action",
    });
  }

  if (
    !["reviewer", "admin"].includes(body.session_variables["x-hasura-role"])
  ) {
    logger.error("Unauthorized access."),
      { role: body.session_variables["x-hasura-role"] };
    return errorHasuraQuery({ req });
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

  const { app_id } = parsedParams;

  // Anchor: Get relative paths for images from the database
  const client = await getAPIReviewerGraphqlClient();

  const { app: appInfo } = await getAppReviewImages(client).GetAppReviewImages({
    app_id: app_id as string,
  });

  // If the app is not found, return an error
  if (appInfo.length === 0 || appInfo[0].app_metadata.length === 0) {
    return errorHasuraQuery({
      req,
      detail: "App not found",
      code: "not_found",
    });
  }

  const app = appInfo[0].app_metadata[0];

  const s3Client = new S3Client({
    region: process.env.ASSETS_S3_REGION,
  });

  // Anchor: Get Signed URLS for images
  const objectKey = `unverified/${app_id}/`;
  const bucketName = process.env.ASSETS_S3_BUCKET_NAME;
  const urlExpiration = 7200;
  const urlPromises = [];

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: objectKey + app.logo_img_url,
  });

  if (app.logo_img_url) {
    urlPromises.push(
      getSignedUrl(s3Client, command, { expiresIn: urlExpiration }).then(
        (url) => ({
          logo_img_url: url,
        }),
      ),
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
        { expiresIn: urlExpiration },
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
        { expiresIn: urlExpiration },
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

  return NextResponse.json(formattedSignedUrl);
};
