import {
  errorHasuraQuery,
  errorNotAllowed,
  errorResponse,
} from "src/backend/errors";
import { NextApiRequest, NextApiResponse } from "next";
import * as yup from "yup";
import { validateRequestSchema } from "src/backend/utils";
import { getAPIServiceGraphqlClient } from "src/backend/graphql";
import { getSdk as getUnverifiedImagesSDK } from "@/api/images/graphql/getUnverifiedImages.generated";
import { Session, getSession, withApiAuthRequired } from "@auth0/nextjs-auth0";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { logger } from "@/lib/logger";

export type ImageGetAllUnverifiedImagesResponse = {
  urls?: {
    logo_img_url?: string;
    hero_image_url?: string;
    showcase_img_urls?: string[];
  };
  success?: boolean;
};

const schema = yup.object({
  app_id: yup.string().strict().required(),
  team_id: yup.string().strict().required(),
});

export type ImageGetAllUnverifiedImagesBody = yup.InferType<typeof schema>;
// This endpoint takes in an App ID and returns all available unverified images for that app.
export const handleGetAllUnverifiedImages = withApiAuthRequired(
  async (
    req: NextApiRequest,
    res: NextApiResponse<ImageGetAllUnverifiedImagesResponse>
  ) => {
    try {
      if (!req.method || req.method !== "GET") {
        return errorNotAllowed(req.method, res, req);
      }

      const { isValid, parsedParams, handleError } =
        await validateRequestSchema({
          value: req.query,
          schema,
        });

      if (!isValid || !parsedParams) {
        return handleError(req, res);
      }
      const { app_id, team_id } = req.query;

      const session = (await getSession(req, res)) as Session;
      const auth0Team = session?.user.hasura.team_id;

      const client = await getAPIServiceGraphqlClient();
      const { app: appInfo } = await getUnverifiedImagesSDK(
        client
      ).GetUnverifiedImages({
        team_id: auth0Team,
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
          }))
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
            { expiresIn: 7200 }
          ).then((url) => ({ hero_image_url: url }))
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
            { expiresIn: 7200 }
          )
        );
        const showcaseUrls = await Promise.all(showcaseUrlPromises);
        urlPromises.push({ showcase_img_urls: showcaseUrls });
      } else {
        urlPromises.push({ showcase_img_urls: [] });
      }
      const signedUrls = await Promise.all(urlPromises);
      const formattedSignedUrl = signedUrls.reduce(
        (a, urlObj) => ({ ...a, ...urlObj }),
        {}
      );
      res.status(200).json({
        urls: formattedSignedUrl,
        success: true,
      });
    } catch (error) {
      logger.error("Error getting images.", { error });
      return errorResponse(
        res,
        500,
        "internal_server_error",
        "Unable to get images",
        null,
        req
      );
    }
  }
);
