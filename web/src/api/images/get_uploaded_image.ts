import {
  errorHasuraQuery,
  errorNotAllowed,
  errorResponse,
} from "src/backend/errors";
import { NextApiRequest, NextApiResponse } from "next";
import * as yup from "yup";
import { validateRequestSchema } from "src/backend/utils";
import { getAPIServiceGraphqlClient } from "src/backend/graphql";
import { getSdk as checkUserInAppDocumentSDK } from "@/api/images/graphql/checkUserInApp.generated";
import { Session, getSession, withApiAuthRequired } from "@auth0/nextjs-auth0";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { logger } from "@/lib/logger";

export type ImageGetResponse = {
  url?: string;
  success?: boolean;
};

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
});

export type ImageGetBody = yup.InferType<typeof schema>;
// This endpoint takes in an appID and image and returns that particular image
export const handleImageGet = withApiAuthRequired(
  async (req: NextApiRequest, res: NextApiResponse<ImageGetResponse>) => {
    try {
      if (!req.method || req.method !== "GET") {
        return errorNotAllowed(req.method, res, req);
      }

      const { isValid, parsedParams, handleError } =
        await validateRequestSchema({
          value: req.query,
          schema,
        });

      const { app_id, image_type } = req.query;

      if (!isValid || !parsedParams) {
        return handleError(req, res);
      }
      const session = (await getSession(req, res)) as Session;
      const auth0Team = session?.user.hasura.team_id;

      const client = await getAPIServiceGraphqlClient();
      const { team: userTeam } = await checkUserInAppDocumentSDK(
        client
      ).CheckUserInApp({
        team_id: auth0Team,
        app_id: app_id as string,
      });
      if (!userTeam[0].apps.some((app) => app.id === app_id)) {
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
      const objectKey = `unverified/${app_id}/${image_type}.png`;

      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
      });
      const signedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 900, // The URL will expire in 15 minutes
      });

      res.status(200).json({
        url: signedUrl,
        success: true,
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
  }
);
