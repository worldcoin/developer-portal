import { getSdk as getAppMetadataSDK } from "@/api/hasura/verify-app/graphql/getAppMetadata.generated";
import { getSdk as verifyAppSDK } from "@/api/hasura/verify-app/graphql/verifyApp.generated";
import { errorHasuraQuery } from "@/api/helpers/errors";
import { getAPIReviewerGraphqlClient } from "@/api/helpers/graphql";
import { resizeAndUploadImage } from "@/api/helpers/image-processing";
import { getFileExtension, protectInternalEndpoint } from "@/api/helpers/utils";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import * as Types from "@/graphql/graphql";
import { logger } from "@/lib/logger";
import {
  CopyObjectCommand,
  ListObjectsCommand,
  PutObjectTaggingCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";

const schema = yup
  .object({
    app_id: yup.string().strict().required(),
    reviewer_name: yup.string().strict().required(),
    is_reviewer_app_store_approved: yup.boolean().required(),
    is_reviewer_world_app_approved: yup.boolean().required(),
  })
  .noUnknown();

export const POST = async (req: NextRequest) => {
  if (!process.env.ASSETS_S3_BUCKET_NAME || !process.env.ASSETS_S3_REGION) {
    logger.error("AWS config is not set.");
    return errorHasuraQuery({
      req,
      detail: "AWS config is not set.",
      code: "invalid_config",
    });
  }

  const { isAuthenticated, errorResponse } = protectInternalEndpoint(req);
  if (!isAuthenticated) {
    return errorResponse;
  }

  const body = await req.json();
  if (body?.action.name !== "verify_app") {
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
      detail: "Invalid request body.",
      code: "invalid_request",
    });
  }

  const app_id = parsedParams.app_id;

  const {
    reviewer_name,
    is_reviewer_app_store_approved,
    is_reviewer_world_app_approved,
  } = parsedParams;

  const reviewer_client = await getAPIReviewerGraphqlClient();

  const { app: appMetadata } = await getAppMetadataSDK(
    reviewer_client,
  ).GetAppMetadata({
    app_id,
  });

  const app = appMetadata[0];
  if (!app) {
    return errorHasuraQuery({
      req,
      detail: "App not found.",
      code: "not_found",
    });
  }

  const awaitingReviewAppMetadata = app.app_metadata.find(
    (metadata) => metadata.verification_status === "awaiting_review",
  );

  if (!awaitingReviewAppMetadata) {
    return errorHasuraQuery({
      req,
      detail: "No app awaiting review.",
      code: "invalid_verification_status",
      app_id,
    });
  }

  const verifiedAppMetadata = app.app_metadata.find(
    (metadata) => metadata.verification_status === "verified",
  );

  // Check if app is allowed to be app store and world app approved
  if (
    (is_reviewer_app_store_approved || is_reviewer_world_app_approved) &&
    !awaitingReviewAppMetadata.showcase_img_urls
  ) {
    return errorHasuraQuery({
      req,
      detail:
        "Showcase images are required for app store and world app approval",
      code: "invalid_approval_permissions",
      app_id,
    });
  }

  const s3Client = new S3Client({
    region: process.env.ASSETS_S3_REGION,
  });

  const bucketName = process.env.ASSETS_S3_BUCKET_NAME;
  const sourcePrefix = `unverified/${app_id}/`;
  const destinationPrefix = `verified/${app_id}/`;

  // In case we have some stale images in the folder we iterate directly to delete
  const listObjectsResponse = await s3Client.send(
    new ListObjectsCommand({
      Bucket: bucketName,
      Prefix: destinationPrefix,
    }),
  );

  const verifiedImageKeysToDelete = listObjectsResponse.Contents?.map(
    (object) => object.Key,
  );

  if (verifiedImageKeysToDelete && verifiedImageKeysToDelete.length > 0) {
    const expirePromises = verifiedImageKeysToDelete.map((key) =>
      s3Client.send(
        new PutObjectTaggingCommand({
          Bucket: bucketName,
          Key: key,
          Tagging: {
            TagSet: [
              {
                Key: "expired",
                Value: "true",
              },
            ],
          },
        }),
      ),
    );
    await Promise.all(expirePromises);
  }

  // Copy unverified images to verified images with random names
  const copyPromises = [];

  const currentLogoImgName = awaitingReviewAppMetadata.logo_img_url;
  const logoFileType = getFileExtension(currentLogoImgName);
  const newLogoImgName = randomUUID();

  // Copy original logo image with _original suffix
  copyPromises.push(
    s3Client.send(
      new CopyObjectCommand({
        Bucket: bucketName,
        CopySource: `${bucketName}/${sourcePrefix}${currentLogoImgName}`,
        Key: `${destinationPrefix}${newLogoImgName}_original${logoFileType}`,
      }),
    ),
  );

  // Create and upload 50x50 resized version of the logo
  const resizePromise = resizeAndUploadImage(
    s3Client,
    bucketName,
    `${sourcePrefix}${currentLogoImgName}`,
    `${destinationPrefix}${newLogoImgName}${logoFileType}`,
    100,
    100,
    logoFileType,
  );

  copyPromises.push(resizePromise);

  const currentMetaTagImgName = awaitingReviewAppMetadata?.meta_tag_image_url;
  let newMetaTagImgName: string = "";

  if (currentMetaTagImgName) {
    const metaTagFileType = getFileExtension(currentMetaTagImgName);
    newMetaTagImgName = randomUUID() + metaTagFileType;

    copyPromises.push(
      s3Client.send(
        new CopyObjectCommand({
          Bucket: bucketName,
          CopySource: `${bucketName}/${sourcePrefix}${currentMetaTagImgName}`,
          Key: `${destinationPrefix}${newMetaTagImgName}`,
        }),
      ),
    );
  }

  const currentContentCardImgName =
    awaitingReviewAppMetadata?.content_card_image_url;
  let newContentCardImgName: string = "";

  if (currentContentCardImgName) {
    const contentCardFileType = getFileExtension(currentContentCardImgName);
    newContentCardImgName = randomUUID() + contentCardFileType;

    copyPromises.push(
      s3Client.send(
        new CopyObjectCommand({
          Bucket: bucketName,
          CopySource: `${bucketName}/${sourcePrefix}${currentContentCardImgName}`,
          Key: `${destinationPrefix}${newContentCardImgName}`,
        }),
      ),
    );
  }

  const showcaseImgUrls = awaitingReviewAppMetadata.showcase_img_urls;
  let showcaseImgUUIDs: string[] | null = null;

  if (showcaseImgUrls) {
    const showcaseFileTypes = showcaseImgUrls.map((url: string) =>
      getFileExtension(url),
    );

    showcaseImgUUIDs = showcaseImgUrls.map(
      (_: string, index: number) => randomUUID() + showcaseFileTypes[index],
    );

    const showcaseCopyPromises = showcaseImgUrls.map(
      (key: string, index: number) => {
        return s3Client.send(
          new CopyObjectCommand({
            Bucket: bucketName,
            CopySource: `${bucketName}/${sourcePrefix}${key}`,
            Key: `${destinationPrefix}${showcaseImgUUIDs?.[index]}`,
          }),
        );
      },
    );
    copyPromises.push(...showcaseCopyPromises);
  }

  // Handle localisation image updates
  const localisationUpdates = [];
  for (const localisation of awaitingReviewAppMetadata.localisations) {
    const update: Types.Localisations_Updates = {
      where: { id: { _eq: localisation.id } },
      _set: {},
    };

    if (localisation.meta_tag_image_url) {
      const metaTagFileType = getFileExtension(localisation.meta_tag_image_url);
      const newLocalisationMetaTagImgName = randomUUID() + metaTagFileType;

      copyPromises.push(
        s3Client.send(
          new CopyObjectCommand({
            Bucket: bucketName,
            CopySource: `${bucketName}/${sourcePrefix}${localisation.locale}/${localisation.meta_tag_image_url}`,
            Key: `${destinationPrefix}${localisation.locale}/${newLocalisationMetaTagImgName}`,
          }),
        ),
      );
      if (update._set) {
        update._set.meta_tag_image_url = newLocalisationMetaTagImgName;
      }
    }

    if (localisation.showcase_img_urls) {
      const showcaseFileTypes = localisation.showcase_img_urls.map(
        (url: string) => getFileExtension(url),
      );
      const newLocalisationShowcaseImgNames =
        localisation.showcase_img_urls.map(
          (_: string, index: number) => randomUUID() + showcaseFileTypes[index],
        );

      const showcaseCopyPromises = localisation.showcase_img_urls.map(
        (key: string, index: number) => {
          return s3Client.send(
            new CopyObjectCommand({
              Bucket: bucketName,
              CopySource: `${bucketName}/${sourcePrefix}${localisation.locale}/${key}`,
              Key: `${destinationPrefix}${localisation.locale}/${newLocalisationShowcaseImgNames[index]}`,
            }),
          );
        },
      );
      copyPromises.push(...showcaseCopyPromises);
      if (update._set) {
        update._set.showcase_img_urls = newLocalisationShowcaseImgNames;
      }
    }

    if (update._set && Object.keys(update._set).length > 0) {
      localisationUpdates.push(update);
    }
  }

  await Promise.all(copyPromises);

  // Update app metadata unverified to reflect new verified images, change verification_status to verified, verified_at, reviewed_by etc.
  // Also update app.first_verified_at if it's not set yet

  const currentTimestamp = new Date().toISOString();

  // Set first_verified_at only if it's not already set
  const appUpdates: any = {};
  if (!app.first_verified_at) {
    appUpdates.first_verified_at = currentTimestamp;
  }

  const updateAppMetadata = await verifyAppSDK(reviewer_client).verifyApp({
    idToVerify: awaitingReviewAppMetadata.id,
    idToDelete: verifiedAppMetadata ? verifiedAppMetadata?.id : "", // No app has id "" so this will delete nothing
    verified_data_changes: {
      logo_img_url: `${newLogoImgName}${logoFileType}`,
      hero_image_url: "",
      meta_tag_image_url: newMetaTagImgName,
      showcase_img_urls: showcaseImgUUIDs,
      content_card_image_url: newContentCardImgName,
      verification_status: "verified",
      verified_at: currentTimestamp,
      reviewed_by: reviewer_name,
      is_reviewer_app_store_approved: is_reviewer_app_store_approved,
      is_reviewer_world_app_approved: is_reviewer_world_app_approved,
    },
    localisation_updates: localisationUpdates,
    app_id: app_id,
    app_updates: appUpdates,
  });

  if (!updateAppMetadata.update_app_metadata_by_pk) {
    return errorHasuraQuery({
      req,
      detail: "Unable to verify.",
      code: "verification_failed",
      app_id,
    });
  }

  return NextResponse.json({ success: true });
};
