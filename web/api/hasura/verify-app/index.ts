import { getSdk as getAppMetadataSDK } from "@/api/hasura/verify-app/graphql/getAppMetadata.generated";
import { getSdk as assetSettlementSDK } from "@/api/hasura/verify-app/graphql/assetSettlement.generated";
import { getSdk as verifyAppSDK } from "@/api/hasura/verify-app/graphql/verifyApp.generated";
import { errorHasuraQuery } from "@/api/helpers/errors";
import { getAPIReviewerGraphqlClient } from "@/api/helpers/graphql";
import {
  processContentCardImage,
  processLogoImage,
  settleImageWrites,
} from "@/api/helpers/image-processing";
import {
  collectVerifiedReviewerAssetKeys,
  deletePreparedReviewerAssets,
  expireVerifiedReviewerAssets,
} from "@/api/helpers/reviewer-decision-assets";
import { hasActiveListingReview } from "@/api/helpers/reviewer-workflow";
import { getFileExtension, protectInternalEndpoint } from "@/api/helpers/utils";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { logger } from "@/lib/logger";
import { CopyObjectCommand, S3Client } from "@aws-sdk/client-s3";
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

type PreparedLocalizationAssets = Record<
  string,
  {
    meta_tag_image_url?: string;
    showcase_img_urls?: string[];
  }
>;

const cleanupPreparedAssets = async ({
  keys,
  s3Client,
  bucketName,
  appId,
}: {
  keys: string[];
  s3Client: S3Client;
  bucketName: string;
  appId: string;
}) => {
  if (keys.length === 0) return true;
  try {
    await deletePreparedReviewerAssets({ keys, s3Client, bucketName });
    return true;
  } catch (error) {
    logger.error("Failed to compensate legacy verification assets", {
      app_id: appId,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return false;
  }
};

const expirePriorAssets = async ({
  keys,
  s3Client,
  bucketName,
  appId,
}: {
  keys: string[];
  s3Client: S3Client;
  bucketName: string;
  appId: string;
}) => {
  if (keys.length === 0) return true;
  try {
    const failedKeys = await expireVerifiedReviewerAssets({
      keys,
      s3Client,
      bucketName,
    });
    if (failedKeys.length > 0) {
      logger.warn(
        "Some superseded legacy verification assets were not expired",
        {
          app_id: appId,
          failedAssetCount: failedKeys.length,
        },
      );
      return false;
    }
    return true;
  } catch (error) {
    logger.error("Failed to expire superseded legacy verification assets", {
      app_id: appId,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return false;
  }
};

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
  const assetSettlementClient = assetSettlementSDK(reviewer_client);

  const completeAssetSettlement = async ({
    operationId,
    outcome,
    deliverySucceeded,
    error,
  }: {
    operationId: string;
    outcome: "committed" | "aborted";
    deliverySucceeded: boolean;
    error: string | null;
  }) => {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const result =
          await assetSettlementClient.CompleteLegacyVerificationAssetSettlement(
            {
              operation_id: operationId,
              worker_id: null,
              expected_outcome: outcome,
              delivery_succeeded: deliverySucceeded,
              error,
            },
          );
        const settlement =
          result.complete_legacy_app_verification_asset_settlement[0];
        if (settlement) return settlement;
      } catch {
        // Exact completion is idempotent. If both responses are lost, the
        // durable lease worker will retry the registered operation.
      }
    }
    logger.error("Legacy verification asset settlement was not finalized", {
      operation_id: operationId,
      outcome,
    });
    return null;
  };

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
      logLevel: "warn",
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

  let hasActiveReview = false;
  try {
    hasActiveReview = await hasActiveListingReview(
      awaitingReviewAppMetadata.id,
    );
  } catch (error) {
    logger.error("Failed to check the reviewer workflow fence", {
      app_id,
      metadata_id: awaitingReviewAppMetadata.id,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return errorHasuraQuery({
      req,
      detail: "Unable to verify reviewer workflow state.",
      code: "reviewer_workflow_unavailable",
      app_id,
    });
  }

  const usesReviewerPortal = ["mini-app", "external"].includes(
    awaitingReviewAppMetadata.app_mode,
  );

  if (
    hasActiveReview ||
    (usesReviewerPortal && awaitingReviewAppMetadata.is_developer_allow_listing)
  ) {
    return errorHasuraQuery({
      req,
      detail: "This listing is managed by the reviewer portal.",
      code: "active_reviewer_workflow",
      app_id,
    });
  }

  const verifiedAppMetadata = app.app_metadata.find(
    (metadata) => metadata.verification_status === "verified",
  );

  const isNativeApp = awaitingReviewAppMetadata.app_mode === "native";
  const nativeAppStoreApproval = isNativeApp && is_reviewer_app_store_approved;
  const nativeWorldAppApproval = isNativeApp && is_reviewer_world_app_approved;

  if (
    (nativeAppStoreApproval || nativeWorldAppApproval) &&
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
  const operationId = randomUUID();
  const priorAssetKeys = verifiedAppMetadata
    ? collectVerifiedReviewerAssetKeys({
        appId: app_id,
        metadata: verifiedAppMetadata,
      })
    : [];

  // Build the complete immutable plan without starting an S3 write. The plan
  // is registered durably below before any closure is invoked.
  const assetWrites: Array<() => Promise<unknown>> = [];
  const preparedAssetKeys: string[] = [];

  // Create and upload 3 versions of the logo image
  // 400x400, 100% quality - used as a main logo image
  // 400x400, 30px rounded corners, 100% quality - rounded logo image, has _rounded suffix
  // original dimensions, 100% quality - original logo image, has _original suffix
  const currentLogoImgName = awaitingReviewAppMetadata.logo_img_url;
  const logoFileType = getFileExtension(currentLogoImgName);
  const newLogoImgName = randomUUID();
  preparedAssetKeys.push(
    `${destinationPrefix}${newLogoImgName}${logoFileType}`,
    `${destinationPrefix}${newLogoImgName}_original${logoFileType}`,
    `${destinationPrefix}${newLogoImgName}_rounded.png`,
  );
  assetWrites.push(() =>
    processLogoImage(
      s3Client,
      bucketName,
      `${sourcePrefix}${currentLogoImgName}`,
      destinationPrefix,
      newLogoImgName,
      400,
      400,
      30,
      100,
      logoFileType.replace(".", ""),
    ),
  );

  const currentMetaTagImgName = awaitingReviewAppMetadata?.meta_tag_image_url;
  let newMetaTagImgName: string = "";

  if (currentMetaTagImgName) {
    const metaTagFileType = getFileExtension(currentMetaTagImgName);
    newMetaTagImgName = randomUUID() + metaTagFileType;
    preparedAssetKeys.push(`${destinationPrefix}${newMetaTagImgName}`);

    assetWrites.push(() =>
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
    preparedAssetKeys.push(`${destinationPrefix}${newContentCardImgName}`);

    assetWrites.push(() =>
      processContentCardImage(
        s3Client,
        bucketName,
        `${sourcePrefix}${currentContentCardImgName}`,
        `${destinationPrefix}${newContentCardImgName}`,
        contentCardFileType.replace(".", ""),
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
    preparedAssetKeys.push(
      ...showcaseImgUUIDs.map((name) => `${destinationPrefix}${name}`),
    );

    const showcaseCopyPromises = showcaseImgUrls.map(
      (key: string, index: number) => {
        return () =>
          s3Client.send(
            new CopyObjectCommand({
              Bucket: bucketName,
              CopySource: `${bucketName}/${sourcePrefix}${key}`,
              Key: `${destinationPrefix}${showcaseImgUUIDs?.[index]}`,
            }),
          );
      },
    );
    assetWrites.push(...showcaseCopyPromises);
  }

  // Handle localisation image updates
  const localizationAssets: PreparedLocalizationAssets = {};
  for (const localisation of awaitingReviewAppMetadata.localisations) {
    const update: PreparedLocalizationAssets[string] = {};

    if (localisation.meta_tag_image_url) {
      const metaTagFileType = getFileExtension(localisation.meta_tag_image_url);
      const newLocalisationMetaTagImgName = randomUUID() + metaTagFileType;
      preparedAssetKeys.push(
        `${destinationPrefix}${localisation.locale}/${newLocalisationMetaTagImgName}`,
      );

      assetWrites.push(() =>
        s3Client.send(
          new CopyObjectCommand({
            Bucket: bucketName,
            CopySource: `${bucketName}/${sourcePrefix}${localisation.locale}/${localisation.meta_tag_image_url}`,
            Key: `${destinationPrefix}${localisation.locale}/${newLocalisationMetaTagImgName}`,
          }),
        ),
      );
      update.meta_tag_image_url = newLocalisationMetaTagImgName;
    }

    if (localisation.showcase_img_urls) {
      const showcaseFileTypes = localisation.showcase_img_urls.map(
        (url: string) => getFileExtension(url),
      );
      const newLocalisationShowcaseImgNames =
        localisation.showcase_img_urls.map(
          (_: string, index: number) => randomUUID() + showcaseFileTypes[index],
        );
      preparedAssetKeys.push(
        ...newLocalisationShowcaseImgNames.map(
          (name) => `${destinationPrefix}${localisation.locale}/${name}`,
        ),
      );

      const showcaseCopyPromises = localisation.showcase_img_urls.map(
        (key: string, index: number) => {
          return () =>
            s3Client.send(
              new CopyObjectCommand({
                Bucket: bucketName,
                CopySource: `${bucketName}/${sourcePrefix}${localisation.locale}/${key}`,
                Key: `${destinationPrefix}${localisation.locale}/${newLocalisationShowcaseImgNames[index]}`,
              }),
            );
        },
      );
      assetWrites.push(...showcaseCopyPromises);
      update.showcase_img_urls = newLocalisationShowcaseImgNames;
    }

    if (Object.keys(update).length > 0) {
      localizationAssets[localisation.id] = update;
    }
  }

  const expectedLocalizationVersions = Object.fromEntries(
    awaitingReviewAppMetadata.localisations.map((localization) => [
      localization.id,
      localization.updated_at,
    ]),
  );

  const verificationVariables = {
    app_id,
    id_to_verify: awaitingReviewAppMetadata.id,
    operation_id: operationId,
    expected_metadata_updated_at: awaitingReviewAppMetadata.updated_at,
    expected_prior_verified_id: verifiedAppMetadata?.id ?? null,
    expected_prior_verified_updated_at: verifiedAppMetadata?.updated_at ?? null,
    expected_localization_versions: expectedLocalizationVersions,
    reviewer_name,
    is_reviewer_app_store_approved: nativeAppStoreApproval,
    is_reviewer_world_app_approved: nativeWorldAppApproval,
    metadata_assets: {
      logo_img_url: `${newLogoImgName}${logoFileType}`,
      meta_tag_image_url: newMetaTagImgName,
      showcase_img_urls: showcaseImgUUIDs,
      content_card_image_url: newContentCardImgName,
    },
    localization_assets: localizationAssets,
  };

  let registration:
    | Awaited<
        ReturnType<
          typeof assetSettlementClient.RegisterLegacyVerificationAssetSettlement
        >
      >["register_legacy_app_verification_asset_settlement"][number]
    | undefined;
  let registrationError: unknown;
  let registrationResponded = false;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const result =
        await assetSettlementClient.RegisterLegacyVerificationAssetSettlement({
          operation_id: operationId,
          app_id,
          app_metadata_id: awaitingReviewAppMetadata.id,
          expected_metadata_updated_at: awaitingReviewAppMetadata.updated_at,
          prepared_asset_keys: preparedAssetKeys,
          prior_asset_keys: priorAssetKeys,
        });
      registration =
        result.register_legacy_app_verification_asset_settlement[0];
      registrationResponded = true;
      break;
    } catch (error) {
      registrationError = error;
    }
  }
  if (
    !registrationResponded ||
    !registration ||
    registration.outcome !== "pending" ||
    registration.delivery_status !== "pending"
  ) {
    throw new Error("Unable to register legacy verification assets.", {
      cause: registrationError,
    });
  }

  try {
    await settleImageWrites(assetWrites.map((write) => write()));
  } catch (error) {
    const cleaned = await cleanupPreparedAssets({
      keys: preparedAssetKeys,
      s3Client,
      bucketName,
      appId: app_id,
    });
    await completeAssetSettlement({
      operationId,
      outcome: "aborted",
      deliverySucceeded: cleaned,
      error: cleaned ? null : "Legacy verification asset cleanup failed.",
    });
    throw error;
  }

  let updateAppMetadata;
  try {
    updateAppMetadata = await verifyAppSDK(reviewer_client).verifyApp(
      verificationVariables,
    );
  } catch (mutationError) {
    logger.warn("Legacy verification response was lost; reconciling", {
      app_id,
      metadata_id: awaitingReviewAppMetadata.id,
      errorName:
        mutationError instanceof Error ? mutationError.name : "UnknownError",
    });
    try {
      // The same operation ID is idempotent in the database. This retry waits
      // behind an in-flight first attempt, then either returns that exact
      // durable result or performs the still-valid CAS itself.
      updateAppMetadata = await verifyAppSDK(reviewer_client).verifyApp(
        verificationVariables,
      );
    } catch (reconciliationError) {
      try {
        const exactRead = await getAppMetadataSDK(
          reviewer_client,
        ).GetAppMetadata({ app_id });
        const exactMetadata = exactRead.app[0]?.app_metadata.find(
          (candidate) => candidate.id === awaitingReviewAppMetadata.id,
        );

        if (
          exactMetadata?.verification_status === "verified" &&
          exactMetadata.legacy_verification_operation_id === operationId
        ) {
          const expired = await expirePriorAssets({
            keys: priorAssetKeys,
            s3Client,
            bucketName,
            appId: app_id,
          });
          await completeAssetSettlement({
            operationId,
            outcome: "committed",
            deliverySucceeded: expired,
            error: expired
              ? null
              : "Legacy verification prior asset expiry failed.",
          });
          return NextResponse.json({ success: true });
        }

        if (
          !exactMetadata ||
          exactMetadata.verification_status !== "awaiting_review" ||
          exactMetadata.updated_at !== awaitingReviewAppMetadata.updated_at
        ) {
          const cleaned = await cleanupPreparedAssets({
            keys: preparedAssetKeys,
            s3Client,
            bucketName,
            appId: app_id,
          });
          await completeAssetSettlement({
            operationId,
            outcome: "aborted",
            deliverySucceeded: cleaned,
            error: cleaned ? null : "Legacy verification asset cleanup failed.",
          });
          return errorHasuraQuery({
            req,
            detail: "The submitted app changed before verification completed.",
            code: "verification_conflict",
            app_id,
          });
        }
      } catch (readError) {
        logger.error("Legacy verification outcome lookup failed", {
          app_id,
          metadata_id: awaitingReviewAppMetadata.id,
          errorName:
            readError instanceof Error ? readError.name : "UnknownError",
        });
      }

      // The durable pending row owns both prepared and prior keys. Its worker
      // waits for the exact metadata lock before choosing cleanup or expiry.
      logger.error("Legacy verification outcome remains ambiguous", {
        app_id,
        metadata_id: awaitingReviewAppMetadata.id,
        mutationErrorName:
          mutationError instanceof Error ? mutationError.name : "UnknownError",
        reconciliationErrorName:
          reconciliationError instanceof Error
            ? reconciliationError.name
            : "UnknownError",
      });
      throw reconciliationError;
    }
  }

  if (updateAppMetadata.legacy_verify_app_metadata.length === 0) {
    const cleaned = await cleanupPreparedAssets({
      keys: preparedAssetKeys,
      s3Client,
      bucketName,
      appId: app_id,
    });
    await completeAssetSettlement({
      operationId,
      outcome: "aborted",
      deliverySucceeded: cleaned,
      error: cleaned ? null : "Legacy verification asset cleanup failed.",
    });
    return errorHasuraQuery({
      req,
      detail: "The submitted app changed before verification completed.",
      code: "verification_conflict",
      app_id,
    });
  }

  const expired = await expirePriorAssets({
    keys: priorAssetKeys,
    s3Client,
    bucketName,
    appId: app_id,
  });
  await completeAssetSettlement({
    operationId,
    outcome: "committed",
    deliverySucceeded: expired,
    error: expired ? null : "Legacy verification prior asset expiry failed.",
  });

  return NextResponse.json({ success: true });
};
