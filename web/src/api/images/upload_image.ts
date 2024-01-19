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
import { S3Client } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { logger } from "@/lib/logger";

export type ImageUploadResponse = {
  url?: string;
  success?: boolean;
};

const schema = yup.object({
  app_id: yup.string().strict().required(),
  team_id: yup.string().strict().required(),
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
  content_type_ending: yup.string().strict().oneOf(["png", "jpg"]).required(),
});

export type ImageUploadBody = yup.InferType<typeof schema>;
// This endpoint takes an AppID and checks the user is on the team. If so it returns a signed URL to upload an image to S3.
export const handleImageUpload = withApiAuthRequired(
  async (req: NextApiRequest, res: NextApiResponse<ImageUploadResponse>) => {
    try {
      if (!req.method || req.method !== "POST") {
        return errorNotAllowed(req.method, res, req);
      }
      const session = (await getSession(req, res)) as Session;
      const auth0Team = session?.user.hasura.team_id;

      const { isValid, parsedParams, handleError } =
        await validateRequestSchema({
          value: req.body,
          schema,
        });

      if (!isValid || !parsedParams) {
        return handleError(req, res);
      }
      // TODO: Use param team_id 
      const { app_id, image_type, content_type_ending, team_id } = parsedParams;

      const client = await getAPIServiceGraphqlClient();

      const { team: userTeam } = await checkUserInAppDocumentSDK(
        client
      ).CheckUserInApp({
        team_id: auth0Team,
        app_id: app_id,
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
      const objectKey = `unverified/${app_id}/${image_type}.${content_type_ending}`;
      const contentType =
        content_type_ending === "jpg" // jpg needs to use jpeg for mime type
          ? "image/jpeg"
          : `image/${content_type_ending}`;
      const signedUrl = await createPresignedPost(s3Client, {
        Bucket: bucketName,
        Key: objectKey,
        Expires: 600, // URL expires in 10 minutes
        Conditions: [
          ["content-length-range", 0, 250000], // 250 kb max file size
          ["eq", "$Content-Type", contentType],
        ],
      });

      res.status(200).json({
        ...signedUrl,
        success: true,
      });
    } catch (error) {
      logger.error("Error uploading image.", { error });
      return errorResponse(
        res,
        500,
        "internal_server_error",
        "Unable to upload image",
        null,
        req
      );
    }
  }
);
