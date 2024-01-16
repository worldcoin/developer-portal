import { errorNotAllowed, errorResponse } from "src/backend/errors";
import { NextApiRequest, NextApiResponse } from "next";
import * as yup from "yup";
import { validateRequestSchema } from "src/backend/utils";
import { getAPIServiceGraphqlClient } from "src/backend/graphql";
import { getSdk as checkUserInAppDocumentSDK } from "@/api/image-upload/graphql/checkUserInApp.generated";
import { Session, getSession, withApiAuthRequired } from "@auth0/nextjs-auth0";
import { S3Client } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";

export type ImageUploadResponse = { url?: string; message?: string };

const schema = yup.object({
  app_id: yup.string().strict().required(),
  image_type: yup
    .string()
    .strict()
    .oneOf([
      "logo_img",
      "hero_img",
      "showcase_img_1",
      "showcase_img_2",
      "showcase_img_3",
    ])
    .required(),
});

export type ImageUploadBody = yup.InferType<typeof schema>;

export const handleImageUpload = withApiAuthRequired(
  async (req: NextApiRequest, res: NextApiResponse<ImageUploadResponse>) => {
    if (!req.method || req.method !== "POST") {
      return errorNotAllowed(req.method, res, req);
    }

    const session = (await getSession(req, res)) as Session;
    const auth0Team = session?.user.hasura.team_id;

    const { isValid, parsedParams, handleError } = await validateRequestSchema({
      value: req.body,
      schema,
    });

    if (!isValid || !parsedParams) {
      return handleError(req, res);
    }
    const { app_id, image_type } = parsedParams;

    const client = await getAPIServiceGraphqlClient();

    const { team: userTeam } = await checkUserInAppDocumentSDK(
      client
    ).CheckUserInApp({
      team_id: auth0Team,
      app_id: app_id,
    });
    console.log(userTeam[0]);
    if (!userTeam[0].apps.some((app) => app.id === app_id)) {
      return res
        .status(403)
        .json({ message: "User does not have access to this app." });
    }

    const s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    const bucketName = process.env.AWS_BUCKET_NAME;
    const objectKey = `${app_id}/${image_type}.png`;

    const signedUrl = await createPresignedPost(s3Client, {
      Bucket: bucketName!,
      Key: objectKey,
      Fields: {
        "Content-Type": "image/png",
      },
      Expires: 600,
      Conditions: [["content-length-range", 0, 250000]],
    });
    res.status(200).json({
      ...signedUrl,
      message: "Success",
    });
  }
);

// ... (rest of the file remains unchanged)
