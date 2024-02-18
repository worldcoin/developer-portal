import { getSdk as getAppReviewImages } from "@/legacy/api/images/graphql/getAppReviewImages.generated";
import {
  errorHasuraQuery,
  errorNotAllowed,
  errorResponse,
} from "@/legacy/backend/errors";
import { getAPIReviewerGraphqlClient } from "@/legacy/backend/graphql";
import { protectInternalEndpoint } from "@/legacy/backend/utils";
import { logger } from "@/lib/logger";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextApiRequest, NextApiResponse } from "next";

export type ImageGetAppReviewImagesOutput = {
  logo_img_url?: string;
  hero_image_url?: string;
  showcase_img_urls?: string[];
};

/**
 * Used when a reviewer is reviewing an app
 * @param req
 * @param res
 */
export const handleGetAppReviewImages = async (
  req: NextApiRequest,
  res: NextApiResponse,
) => {
  try {
    if (!process.env.ASSETS_S3_REGION) {
      throw new Error("AWS Region must be set.");
    }

    if (!process.env.ASSETS_S3_BUCKET_NAME) {
      throw new Error("AWS Bucket Name must be set.");
    }

    if (!protectInternalEndpoint(req, res)) {
      return;
    }

    if (req.method !== "GET") {
      return errorNotAllowed(req.method, res, req);
    }

    const body = JSON.parse(req.body);

    if (body?.action.name !== "get_app_review_images") {
      return errorHasuraQuery({
        res,
        req,
        detail: "Invalid action.",
        code: "invalid_action",
      });
    }

    if (body.session_variables["x-hasura-role"] !== "reviewer") {
      logger.error("Unauthorized access."),
        { role: body.session_variables["x-hasura-role"] };
      return errorHasuraQuery({ res, req });
    }

    const app_id = req.query.app_id;
    if (!app_id) {
      return errorHasuraQuery({
        res,
        req,
        detail: "app_id must be set.",
        code: "required",
      });
    }

    // Anchor: Get relative paths for images from the database
    const client = await getAPIReviewerGraphqlClient();

    const { app: appInfo } = await getAppReviewImages(
      client,
    ).GetAppReviewImages({
      app_id: app_id as string,
    });

    // If the app is not found, return an error
    if (appInfo.length === 0 || appInfo[0].app_metadata.length === 0) {
      return errorHasuraQuery({
        res,
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
    const urlPromises = [];
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: objectKey + app.logo_img_url,
    });

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

    if (app.showcase_img_urls && Array.isArray(app.showcase_img_urls)) {
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

    res.status(200).json({
      ...formattedSignedUrl,
    });
  } catch (error) {
    logger.error("Error getting images.", { error });

    return errorResponse(
      res,
      500,
      "internal_server_error",
      "Unable to get images",
      null,
      req,
    );
  }
};
