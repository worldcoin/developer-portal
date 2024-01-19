import { errorHasuraQuery, errorNotAllowed } from "src/backend/errors";
import { NextApiRequest, NextApiResponse } from "next";
import * as yup from "yup";
import { getAPIServiceGraphqlClient } from "src/backend/graphql";
import { getSdk as checkUserInAppDocumentSDK } from "@/api/images/graphql/checkUserInApp.generated";
import { Session, getSession, withApiAuthRequired } from "@auth0/nextjs-auth0";
import { S3Client } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { logger } from "@/lib/logger";
import { protectInternalEndpoint } from "@/backend/utils";

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
  content_type_ending: yup.string().strict().oneOf(["png", "jpeg"]).required(),
});

/**
 * Returns a signed url to upload to the predefined path in S3
 * @param req
 * @param res
 */
export const handleImageUpload = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  try {
    if (!protectInternalEndpoint(req, res)) {
      return;
    }

    if (req.method !== "GET") {
      return errorNotAllowed(req.method, res, req);
    }
    const session = (await getSession(req, res)) as Session;

    if (req.body.action?.name !== "upload_image") {
      return errorHasuraQuery({
        res,
        req,
        detail: "Invalid action.",
        code: "invalid_action",
      });
    }
    console.log(req.body.input);
    const validatedInput = await schema.validate(req.body.input);
    const { app_id, image_type, content_type_ending, team_id } = validatedInput;

    const client = await getAPIServiceGraphqlClient();

    if (req.body.session_variables["x-hasura-role"] === "admin") {
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
      team_id: team_id,
      app_id: app_id,
      user_id: session.user.hasura.id,
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
    console.log("done");
    const { url, fields } = signedUrl;
    res.status(200).json({
      url,
      stringifiedFields: JSON.stringify(fields),
    });
  } catch (error: any) {
    logger.error("Error uploading image.", { error });
    return errorHasuraQuery({
      res,
      req,
      detail: "Unable to upload image",
      code: "internal_server_error",
    });
  }
};
