"use server";

import { errorFormAction } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { deleteUnverifiedImage } from "@/api/helpers/image-processing";
import { logger } from "@/lib/logger";
import { getIsUserAllowedToUpdateAppMetadata } from "@/lib/permissions";
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
    const isUserAllowedToUpdateAppMetadata =
      await getIsUserAllowedToUpdateAppMetadata(formData.app_metadata_id);

    if (!isUserAllowedToUpdateAppMetadata) {
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
      app_website_url: parsedParams.app_website_url,
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

    // Fetch current metadata and localizations to identify removed images
    // Note (0x1): Using inline GraphQL query instead of generated SDK since this is a one-off
    // query specific to image cleanup.
    const fetchCurrentMetadataQuery = gql`
      query FetchCurrentMetadataForCleanup($app_metadata_id: String!) {
        app_metadata_by_pk(id: $app_metadata_id) {
          id
          app_id
          meta_tag_image_url
          showcase_img_urls
          localisations {
            id
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

    // Clean up removed images from S3
    if (currentMetadata && appId) {
      const bucketName = process.env.ASSETS_S3_BUCKET_NAME;
      const s3Client =
        bucketName && process.env.ASSETS_S3_REGION
          ? new S3Client({
            region: process.env.ASSETS_S3_REGION,
          })
          : null;

      if (s3Client && bucketName) {
        const deletePromises: Promise<boolean>[] = [];

        // Compare English metadata images (stored on app_metadata)
        const oldEnMetaTag = currentMetadata.meta_tag_image_url || "";
        const newEnMetaTag = appMetadataInput.meta_tag_image_url || "";
        if (oldEnMetaTag && oldEnMetaTag !== newEnMetaTag) {
          deletePromises.push(
            deleteUnverifiedImage(
              s3Client,
              bucketName,
              appId,
              oldEnMetaTag,
            ),
          );
        }

        const oldEnShowcase =
          currentMetadata.showcase_img_urls?.filter(Boolean) || [];
        const newEnShowcase = appMetadataInput.showcase_img_urls || [];
        const removedEnShowcase = oldEnShowcase.filter(
          (img) => !newEnShowcase.includes(img),
        );
        for (const img of removedEnShowcase) {
          deletePromises.push(
            deleteUnverifiedImage(s3Client, bucketName, appId, img),
          );
        }

        // Compare localized images
        const newLocalisationLocales = new Set(
          localisationsToUpsert.map((l) => l.locale),
        );

        for (const oldLoc of currentMetadata.localisations) {
          const isDeleted = !newLocalisationLocales.has(oldLoc.locale);
          const newLoc = localisationsToUpsert.find(
            (l) => l.locale === oldLoc.locale,
          );

          // Handle deleted localizations - delete all their images
          if (isDeleted) {
            if (oldLoc.meta_tag_image_url) {
              deletePromises.push(
                deleteUnverifiedImage(
                  s3Client,
                  bucketName,
                  appId,
                  oldLoc.meta_tag_image_url,
                  oldLoc.locale,
                ),
              );
            }
            if (oldLoc.showcase_img_urls) {
              for (const img of oldLoc.showcase_img_urls.filter(Boolean)) {
                deletePromises.push(
                  deleteUnverifiedImage(
                    s3Client,
                    bucketName,
                    appId,
                    img,
                    oldLoc.locale,
                  ),
                );
              }
            }
          } else if (newLoc) {
            // Handle updated localizations - compare old vs new
            const oldMetaTag = oldLoc.meta_tag_image_url || "";
            const newMetaTag = newLoc.meta_tag_image_url || "";
            if (oldMetaTag && oldMetaTag !== newMetaTag) {
              deletePromises.push(
                deleteUnverifiedImage(
                  s3Client,
                  bucketName,
                  appId,
                  oldMetaTag,
                  oldLoc.locale,
                ),
              );
            }

            const oldShowcase =
              oldLoc.showcase_img_urls?.filter(Boolean) || [];
            const newShowcase = newLoc.showcase_img_urls || [];
            const removedShowcase = oldShowcase.filter(
              (img) => !newShowcase.includes(img),
            );
            for (const img of removedShowcase) {
              deletePromises.push(
                deleteUnverifiedImage(
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

        // Also handle images from localizations that were deleted via DeleteUnusedLocalisations
        const deletedLocalisationLocales =
          deleteResult.delete_localisations?.returning.map((l) => l.locale) ||
          [];
        for (const deletedLocale of deletedLocalisationLocales) {
          const deletedLoc = currentMetadata.localisations.find(
            (l) => l.locale === deletedLocale,
          );
          if (deletedLoc) {
            if (deletedLoc.meta_tag_image_url) {
              deletePromises.push(
                deleteUnverifiedImage(
                  s3Client,
                  bucketName,
                  appId,
                  deletedLoc.meta_tag_image_url,
                  deletedLocale,
                ),
              );
            }
            if (deletedLoc.showcase_img_urls) {
              for (const img of deletedLoc.showcase_img_urls.filter(Boolean)) {
                deletePromises.push(
                  deleteUnverifiedImage(
                    s3Client,
                    bucketName,
                    appId,
                    img,
                    deletedLocale,
                  ),
                );
              }
            }
          }
        }

        // Execute all deletions in parallel (failures are logged but don't throw)
        const deleteResults = await Promise.all(deletePromises);
        const successCount = deleteResults.filter((r) => r).length;
        const failureCount = deleteResults.filter((r) => !r).length;

        if (deletePromises.length > 0) {
          logger.info("Image cleanup completed", {
            app_id: appId,
            total: deletePromises.length,
            success: successCount,
            failures: failureCount,
          });
        }
      }
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
