"use server";

import { errorFormAction } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { expireUnverifiedImage } from "@/api/helpers/image-processing";
import { logger } from "@/lib/logger";
import { getAppMetadataPermissionAndMode } from "@/lib/permissions";
import { extractIdsFromPath, getPathFromHeaders } from "@/lib/server-utils";
import { FormActionResult } from "@/lib/types";
import { S3Client } from "@aws-sdk/client-s3";
import gql from "graphql-tag";
import * as yup from "yup";
import { mainAppStoreFormSchema } from "../FormSchema/form-schema";
import { getSdk as getDeleteUnusedSdk } from "../graphql/server/delete-unused-localisations.generated";
import { getSdk as getUpdateAppStoreSdk } from "../graphql/server/update-app-store-complete.generated";
import {
  encodeDescription,
  extractImagePathWithExtensionFromActualUrl,
} from "../utils";

const schema = mainAppStoreFormSchema
  .concat(
    yup.object({
      app_metadata_id: yup.string().required("App metadata id is required"),
    }),
  )
  .noUnknown();
type Schema = yup.Asserts<typeof schema>;

const formatEmailLink = (email: string): string => {
  return `mailto:${email}`;
};

export async function updateAppStoreMetadata(
  formData: Schema,
): Promise<FormActionResult> {
  const path = getPathFromHeaders() || "";
  const { Apps: appId, Teams: teamId } = extractIdsFromPath(path, [
    "Apps",
    "Teams",
  ]);

  try {
    const { allowed, appMode } = await getAppMetadataPermissionAndMode(
      formData.app_metadata_id,
    );

    if (!allowed) {
      return errorFormAction({
        message:
          "The user does not have permission to update this app metadata",
        team_id: teamId,
        app_id: appId,
        logLevel: "warn",
      });
    }

    let parsedParams: Schema;

    try {
      parsedParams = await schema.validate(formData, {
        abortEarly: false,
        context: { isMiniApp: appMode === "mini-app" },
      });
    } catch (validationError) {
      return errorFormAction({
        error: validationError as Error,
        message: "The provided app metadata is invalid",
        additionalInfo: { formData },
        team_id: teamId,
        app_id: appId,
        logLevel: "warn",
      });
    }

    const supportLink =
      parsedParams.support_type === "email"
        ? formatEmailLink(parsedParams.support_email || "")
        : parsedParams.support_link;
    const enLocalisation = parsedParams.localisations.find(
      (l) => l.language === "en",
    );
    const appMetadataInput = {
      category: parsedParams.category,
      is_android_only: parsedParams.is_android_only,
      is_for_humans_only: parsedParams.is_for_humans_only,
      support_link: supportLink,
      supported_countries: parsedParams.supported_countries,
      supported_languages: parsedParams.supported_languages,
      // en locale fields go directly on app_metadata
      name: enLocalisation?.name || "",
      short_name: enLocalisation?.short_name || "",
      world_app_description: enLocalisation?.world_app_description || "",
      description: encodeDescription(
        enLocalisation?.description_overview || "",
      ),
      meta_tag_image_url: extractImagePathWithExtensionFromActualUrl(
        enLocalisation?.meta_tag_image_url,
      ),
      showcase_img_urls:
        (enLocalisation?.showcase_img_urls
          ?.map(extractImagePathWithExtensionFromActualUrl)
          .filter(Boolean) as string[]) || [],
    };

    const localisationsToUpsert = parsedParams.localisations
      .filter((l) => l.language !== "en")
      .map((l) => ({
        app_metadata_id: formData.app_metadata_id,
        locale: l.language,
        name: l.name,
        short_name: l.short_name,
        world_app_description: l.world_app_description,
        world_app_button_text: "", // backwards compat
        description: encodeDescription(l.description_overview),
        meta_tag_image_url: extractImagePathWithExtensionFromActualUrl(
          l.meta_tag_image_url,
        ),
        hero_image_url: "", // backwards compat
        showcase_img_urls:
          (l.showcase_img_urls
            ?.map(extractImagePathWithExtensionFromActualUrl)
            .filter(Boolean) as string[]) || [],
      }));

    const client = await getAPIServiceGraphqlClient();

    // Fetch current metadata before update to identify removed images
    const fetchCurrentMetadataQuery = gql`
      query FetchCurrentMetadataForCleanup($app_metadata_id: String!) {
        app_metadata_by_pk(id: $app_metadata_id) {
          app_id
          meta_tag_image_url
          showcase_img_urls
          localisations {
            locale
            meta_tag_image_url
            showcase_img_urls
          }
        }
      }
    `;

    const currentMetadataResult = await client.request<{
      app_metadata_by_pk: {
        app_id: string;
        meta_tag_image_url: string;
        showcase_img_urls: string[] | null;
        localisations: Array<{
          locale: string;
          meta_tag_image_url: string;
          showcase_img_urls: string[] | null;
        }>;
      } | null;
    }>(fetchCurrentMetadataQuery, {
      app_metadata_id: formData.app_metadata_id,
    });

    const currentMetadata = currentMetadataResult.app_metadata_by_pk;

    const updateAppStoreSdk = getUpdateAppStoreSdk(client);

    await updateAppStoreSdk.UpdateAppStoreComplete({
      app_metadata_id: formData.app_metadata_id,
      app_metadata_input: appMetadataInput,
      localisations_to_upsert: localisationsToUpsert,
    });

    // delete any localisations that are no longer supported
    // this handles languages that were removed from supported_languages
    const deleteUnusedSdk = getDeleteUnusedSdk(client);
    const deleteResult = await deleteUnusedSdk.DeleteUnusedLocalisations({
      app_metadata_id: formData.app_metadata_id,
      languages_to_keep: parsedParams.supported_languages,
    });

    // Fire-and-forget: expire removed images in S3 via tagging
    if (currentMetadata && appId) {
      expireRemovedImages(
        currentMetadata,
        appMetadataInput,
        localisationsToUpsert,
        deleteResult.delete_localisations?.returning ?? [],
        appId,
      );
    }

    return {
      success: true,
      message: "app store information updated successfully",
    };
  } catch (error) {
    return errorFormAction({
      error: error as Error,
      message: "An error occurred while updating the app metadata",
      additionalInfo: { formData },
      team_id: teamId,
      app_id: appId,
      logLevel: "error",
    });
  }
}

type CurrentMetadata = {
  app_id: string;
  meta_tag_image_url: string;
  showcase_img_urls: string[] | null;
  localisations: Array<{
    locale: string;
    meta_tag_image_url: string;
    showcase_img_urls: string[] | null;
  }>;
};

/**
 * Compares old vs new image URLs and expires removed ones in S3.
 * Runs as fire-and-forget so it never blocks the response.
 */
async function expireRemovedImages(
  currentMetadata: CurrentMetadata,
  appMetadataInput: { meta_tag_image_url: string; showcase_img_urls: string[] },
  localisationsToUpsert: Array<{
    locale: string;
    meta_tag_image_url: string;
    showcase_img_urls: string[];
  }>,
  deletedLocalisations: Array<{ locale: string }>,
  appId: string,
): Promise<void> {
  const bucketName = process.env.ASSETS_S3_BUCKET_NAME;
  const region = process.env.ASSETS_S3_REGION;

  if (!bucketName || !region) {
    return;
  }

  try {
    const s3Client = new S3Client({ region });
    const expirePromises: Promise<boolean>[] = [];

    // English meta_tag_image
    const oldEnMetaTag = currentMetadata.meta_tag_image_url || "";
    const newEnMetaTag = appMetadataInput.meta_tag_image_url || "";
    if (oldEnMetaTag && oldEnMetaTag !== newEnMetaTag) {
      expirePromises.push(
        expireUnverifiedImage(s3Client, bucketName, appId, oldEnMetaTag),
      );
    }

    // English showcase images
    const oldEnShowcase =
      currentMetadata.showcase_img_urls?.filter(Boolean) || [];
    const newEnShowcase = appMetadataInput.showcase_img_urls || [];
    for (const img of oldEnShowcase.filter(
      (i) => !newEnShowcase.includes(i),
    )) {
      expirePromises.push(
        expireUnverifiedImage(s3Client, bucketName, appId, img),
      );
    }

    // Localized images: updated locales
    const newLocaleSet = new Set(localisationsToUpsert.map((l) => l.locale));
    for (const oldLoc of currentMetadata.localisations) {
      const newLoc = localisationsToUpsert.find(
        (l) => l.locale === oldLoc.locale,
      );

      if (!newLocaleSet.has(oldLoc.locale)) {
        // Locale removed entirely via form — expire all its images
        if (oldLoc.meta_tag_image_url) {
          expirePromises.push(
            expireUnverifiedImage(
              s3Client,
              bucketName,
              appId,
              oldLoc.meta_tag_image_url,
              oldLoc.locale,
            ),
          );
        }
        for (const img of oldLoc.showcase_img_urls?.filter(Boolean) ?? []) {
          expirePromises.push(
            expireUnverifiedImage(
              s3Client,
              bucketName,
              appId,
              img,
              oldLoc.locale,
            ),
          );
        }
      } else if (newLoc) {
        // Locale still present — diff individual images
        const oldMeta = oldLoc.meta_tag_image_url || "";
        const newMeta = newLoc.meta_tag_image_url || "";
        if (oldMeta && oldMeta !== newMeta) {
          expirePromises.push(
            expireUnverifiedImage(
              s3Client,
              bucketName,
              appId,
              oldMeta,
              oldLoc.locale,
            ),
          );
        }

        const oldShowcase = oldLoc.showcase_img_urls?.filter(Boolean) ?? [];
        const newShowcase = newLoc.showcase_img_urls || [];
        for (const img of oldShowcase.filter(
          (i) => !newShowcase.includes(i),
        )) {
          expirePromises.push(
            expireUnverifiedImage(
              s3Client,
              bucketName,
              appId,
              img,
              oldLoc.locale,
            ),
          );
        }
      }
    }

    // Images from localisations deleted via DeleteUnusedLocalisations
    for (const { locale } of deletedLocalisations) {
      const deletedLoc = currentMetadata.localisations.find(
        (l) => l.locale === locale,
      );
      if (!deletedLoc) continue;

      if (deletedLoc.meta_tag_image_url) {
        expirePromises.push(
          expireUnverifiedImage(
            s3Client,
            bucketName,
            appId,
            deletedLoc.meta_tag_image_url,
            locale,
          ),
        );
      }
      for (const img of deletedLoc.showcase_img_urls?.filter(Boolean) ?? []) {
        expirePromises.push(
          expireUnverifiedImage(s3Client, bucketName, appId, img, locale),
        );
      }
    }

    if (expirePromises.length > 0) {
      const results = await Promise.all(expirePromises);
      const successes = results.filter(Boolean).length;
      logger.info("Image cleanup completed", {
        app_id: appId,
        total: results.length,
        successes,
        failures: results.length - successes,
      });
    }
  } catch (error) {
    logger.error("Image cleanup failed", { error, app_id: appId });
  }
}
