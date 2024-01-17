import { errorNotAllowed } from "src/backend/errors";
import { NextApiRequest, NextApiResponse } from "next";
import * as yup from "yup";
import { validateRequestSchema } from "src/backend/utils";
import { getAPIServiceGraphqlClient } from "src/backend/graphql";
import { getSdk as checkUserInAppDocumentSDK } from "@/api/images/graphql/checkUserInApp.generated";
import { Session, getSession, withApiAuthRequired } from "@auth0/nextjs-auth0";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export type ImageGetResponse = { url?: string; message?: string };

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

export type ImageGetBody = yup.InferType<typeof schema>;

export const handleImageGet = withApiAuthRequired(
  async (req: NextApiRequest, res: NextApiResponse<ImageGetResponse>) => {
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
    if (!userTeam[0].apps.some((app) => app.id === app_id)) {
      return res
        .status(403)
        .json({ message: "User does not have access to this app." });
    }
    const s3Client = new S3Client({
      region: process.env.AWS_REGION,
    });

    const bucketName = process.env.AWS_BUCKET_NAME;
    const objectKey = `unverified/${app_id}/${image_type}.png`;
    console.log(objectKey);

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    });
    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 9000, // The URL will expire in 2.5 hours
    });
    console.log(signedUrl);

    res.status(200).json({
      url: signedUrl,
      message: "Success",
    });
  }
);
