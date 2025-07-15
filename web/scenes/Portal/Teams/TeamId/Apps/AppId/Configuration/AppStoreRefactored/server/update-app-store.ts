"use server";

import { errorFormAction } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { getIsUserAllowedToUpdateAppMetadata } from "@/lib/permissions";
import { extractIdsFromPath, getPathFromHeaders } from "@/lib/server-utils";
import { mainAppStoreFormSchema } from "../FormSchema/form-schema";
import { AppStoreFormValues } from "../FormSchema/types";
import { getSdk as getDeleteUnusedSdk } from "../graphql/server/delete-unused-localisations.generated";
import { getSdk as getUpdateAppStoreSdk } from "../graphql/server/update-app-store-complete.generated";
import {
  encodeDescription,
  extractImagePathWithExtensionFromActualUrl,
} from "../utils";

type FormActionResult = {
  success: boolean;
  message: string;
};

const formatEmailLink = (email: string): string => {
  return `mailto:${email}`;
};

export async function updateAppStoreMetadata(
  formData: AppStoreFormValues & { app_metadata_id: string },
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
      return {
        success: false,
        message: "insufficient permissions to update app metadata",
      };
    }

    let parsedParams: AppStoreFormValues;

    try {
      parsedParams = await mainAppStoreFormSchema.validate(formData, {
        abortEarly: false,
      });
    } catch (validationError) {
      return errorFormAction({
        error: validationError as Error,
        message: "validation failed",
        additionalInfo: { formData },
        team_id: teamId,
        app_id: appId,
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
    const updateAppStoreSdk = getUpdateAppStoreSdk(client);

    await updateAppStoreSdk.UpdateAppStoreComplete({
      app_metadata_id: formData.app_metadata_id,
      app_metadata_input: appMetadataInput,
      localisations_to_upsert: localisationsToUpsert,
    });

    // delete any localisations that are no longer supported
    // this handles languages that were removed from supported_languages
    const deleteUnusedSdk = getDeleteUnusedSdk(client);
    await deleteUnusedSdk.DeleteUnusedLocalisations({
      app_metadata_id: formData.app_metadata_id,
      languages_to_keep: parsedParams.supported_languages,
    });

    return {
      success: true,
      message: "app store information updated successfully",
    };
  } catch (error) {
    console.error("GraphQL error updating app store metadata:", error);

    return errorFormAction({
      error: error as Error,
      message: "updateAppStoreMetadata - unexpected error",
      additionalInfo: { formData },
      team_id: teamId,
      app_id: appId,
    });
  }
}
