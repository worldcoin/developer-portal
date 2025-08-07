"use server";

import { errorFormAction } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import {
  getIsUserAllowedToDeleteLocalisation,
  getIsUserAllowedToInsertLocalisation,
  getIsUserAllowedToUpdateAppMetadata,
  getIsUserAllowedToUpdateLocalisation,
} from "@/lib/permissions";
import { extractIdsFromPath, getPathFromHeaders } from "@/lib/server-utils";
import { FormActionResult } from "@/lib/types";
import { getSdk as getDeleteLocalisationSdk } from "../AppStoreLocalised/graphql/server/delete-localisation.generated";
import { getSdk as getFetchLocalisationSdk } from "../AppStoreLocalised/graphql/server/fetch-localisation.generated";
import { getSdk as getInsertLocalisationSdk } from "../AppStoreLocalised/graphql/server/insert-localisation.generated";
import {
  getSdk as getUpdateAppInfoSdk,
  UpdateAppInfoMutationVariables,
} from "../AppStoreLocalised/graphql/server/update-app.generated";
import {
  getSdk as getUpdateLocalisationSdk,
  UpdateLocalisationMutationVariables,
} from "../AppStoreLocalised/graphql/server/update-localisation.generated";
import {
  encodeDescription,
  formatEmailLink,
} from "../AppStoreLocalised/utils/util";
import {
  updateAppLocaleInfoInitialSchema,
  UpdateAppLocaleInfoInitialSchema,
  updateAppSupportInfoInitialSchema,
  UpdateAppSupportInfoInitialSchema,
  UpdateLocalisationInitialSchema,
  updateLocalisationInitialSchema,
} from "../form-schema";

export async function validateAndUpdateLocalisationServerSide(
  params: UpdateLocalisationInitialSchema,
): Promise<FormActionResult> {
  const path = getPathFromHeaders() || "";
  const { Apps: appId, Teams: teamId } = extractIdsFromPath(path, [
    "Apps",
    "Teams",
  ]);

  const initalValues = {
    localisation_id: params.localisation_id,
    name: params.name,
    short_name: params.short_name,
    world_app_description: params.world_app_description,
    world_app_button_text: params.world_app_button_text,
    description_overview: params.description_overview,
    description_how_it_works: params.description_how_it_works,
    description_connect: params.description_connect,
    locale: params.locale,
  };

  let encodedInput: UpdateLocalisationMutationVariables = {
    localisation_id: params.localisation_id,
  };

  try {
    const isUserAllowedToUpdateLocalisation =
      await getIsUserAllowedToUpdateLocalisation(params.localisation_id);
    if (!isUserAllowedToUpdateLocalisation) {
      return errorFormAction({
        message:
          "The user does not have permission to update this localisation",
        team_id: teamId,
        app_id: appId,
        logLevel: "warn",
      });
    }

    const { isValid, parsedParams: parsedInitialValues } =
      await validateRequestSchema({
        schema: updateLocalisationInitialSchema,
        value: initalValues,
      });

    if (!isValid || !parsedInitialValues) {
      return errorFormAction({
        message: "The provided localisation data is invalid",
        additionalInfo: { initalValues },
        team_id: teamId,
        app_id: appId,
        logLevel: "warn",
      });
    }

    encodedInput = {
      localisation_id: parsedInitialValues.localisation_id,
      input: {
        name: parsedInitialValues.name,
        short_name: parsedInitialValues.short_name,
        world_app_button_text: parsedInitialValues.world_app_button_text,
        world_app_description: parsedInitialValues.world_app_description,
        description: encodeDescription(
          parsedInitialValues.description_overview,
          parsedInitialValues?.description_how_it_works,
          parsedInitialValues?.description_connect,
        ),
        locale: parsedInitialValues.locale,
      },
    };

    const client = await getAPIServiceGraphqlClient();
    await getUpdateLocalisationSdk(client).UpdateLocalisation(encodedInput);

    return {
      success: true,
      message: "Localisation updated successfully",
    };
  } catch (error) {
    return errorFormAction({
      error: error as Error,
      message: "An error occurred while updating the localisation",
      additionalInfo: {
        encodedInput,
        initalValues,
      },
      team_id: teamId,
      app_id: appId,
      logLevel: "error",
    });
  }
}

export async function validateAndUpdateAppLocaleInfoServerSide(
  params: UpdateAppLocaleInfoInitialSchema,
): Promise<FormActionResult> {
  const path = getPathFromHeaders() || "";
  const { Apps: appId, Teams: teamId } = extractIdsFromPath(path, [
    "Apps",
    "Teams",
  ]);

  const initalValues = {
    name: params.name,
    short_name: params.short_name,
    world_app_description: params.world_app_description,
    world_app_button_text: params.world_app_button_text,
    description_overview: params.description_overview,
    description_how_it_works: params.description_how_it_works,
    description_connect: params.description_connect,
    app_metadata_id: params.app_metadata_id,
    locale: params.locale,
  };
  let encodedInput: UpdateAppInfoMutationVariables = {
    app_metadata_id: params.app_metadata_id,
  };
  try {
    const isUserAllowedToUpdateAppMetadata =
      await getIsUserAllowedToUpdateAppMetadata(params.app_metadata_id);
    if (!isUserAllowedToUpdateAppMetadata) {
      return errorFormAction({
        message:
          "The user does not have permission to update this app metadata",
        team_id: teamId,
        app_id: appId,
        logLevel: "warn",
      });
    }

    const { isValid, parsedParams: parsedInitialValues } =
      await validateRequestSchema({
        schema: updateAppLocaleInfoInitialSchema,
        value: initalValues,
      });

    if (!isValid || !parsedInitialValues) {
      return errorFormAction({
        message: "The provided app locale info is invalid",
        additionalInfo: { initalValues },
        team_id: teamId,
        app_id: appId,
        logLevel: "warn",
      });
    }

    encodedInput = {
      app_metadata_id: parsedInitialValues.app_metadata_id,
      input: {
        name: parsedInitialValues.name,
        short_name: parsedInitialValues.short_name,
        world_app_button_text: parsedInitialValues.world_app_button_text,
        world_app_description: parsedInitialValues.world_app_description,
        description: encodeDescription(
          parsedInitialValues.description_overview,
          parsedInitialValues?.description_how_it_works,
          parsedInitialValues?.description_connect,
        ),
      },
    };

    const client = await getAPIServiceGraphqlClient();
    await getUpdateAppInfoSdk(client).UpdateAppInfo(encodedInput);

    return {
      success: true,
      message: "App locale info updated successfully",
    };
  } catch (error) {
    return errorFormAction({
      error: error as Error,
      message: "An error occurred while updating the app locale info",
      additionalInfo: {
        encodedInput,
        initalValues,
      },
      team_id: teamId,
      app_id: appId,
      logLevel: "error",
    });
  }
}

export async function validateAndUpdateAppSupportInfoServerSide(
  params: UpdateAppSupportInfoInitialSchema,
): Promise<FormActionResult> {
  const path = getPathFromHeaders() || "";
  const { Apps: appId, Teams: teamId } = extractIdsFromPath(path, [
    "Apps",
    "Teams",
  ]);

  const initalValues = {
    app_metadata_id: params.app_metadata_id,
    is_support_email: params.is_support_email,
    support_link: params.support_link,
    support_email: params.support_email,
    app_website_url: params.app_website_url,
    supported_countries: params.supported_countries,
    category: params.category,
    is_android_only: params.is_android_only,
    is_for_humans_only: params.is_for_humans_only,
  };
  let input: UpdateAppInfoMutationVariables = {
    app_metadata_id: params.app_metadata_id,
  };
  try {
    const isUserAllowedToUpdateAppMetadata =
      await getIsUserAllowedToUpdateAppMetadata(params.app_metadata_id);
    if (!isUserAllowedToUpdateAppMetadata) {
      return errorFormAction({
        message:
          "The user does not have permission to update this app metadata",
        team_id: teamId,
        app_id: appId,
        logLevel: "warn",
      });
    }

    const { isValid, parsedParams: parsedInitialValues } =
      await validateRequestSchema({
        schema: updateAppSupportInfoInitialSchema,
        value: initalValues,
      });

    if (!isValid || !parsedInitialValues) {
      return errorFormAction({
        message: "The provided app support info is invalid",
        additionalInfo: { initalValues },
        team_id: teamId,
        app_id: appId,
        logLevel: "warn",
      });
    }

    input = {
      app_metadata_id: parsedInitialValues.app_metadata_id,
      input: {
        support_link: parsedInitialValues.is_support_email
          ? formatEmailLink(parsedInitialValues.support_email)
          : parsedInitialValues.support_link,
        app_website_url: parsedInitialValues.app_website_url,
        supported_countries: parsedInitialValues.supported_countries,
        category: parsedInitialValues.category,
        is_android_only: parsedInitialValues.is_android_only,
        is_for_humans_only: parsedInitialValues.is_for_humans_only,
      },
    };

    const client = await getAPIServiceGraphqlClient();
    await getUpdateAppInfoSdk(client).UpdateAppInfo(input);

    return {
      success: true,
      message: "App support info updated successfully",
    };
  } catch (error) {
    return errorFormAction({
      error: error as Error,
      message: "An error occurred while updating the app support info",
      additionalInfo: { input, initalValues },
      team_id: teamId,
      app_id: appId,
      logLevel: "error",
    });
  }
}

export async function deleteLocalisationServerSide(
  appMetadataId: string,
  locale: string,
): Promise<FormActionResult> {
  const path = getPathFromHeaders() || "";
  const { Apps: appId, Teams: teamId } = extractIdsFromPath(path, [
    "Apps",
    "Teams",
  ]);

  try {
    if (locale === "en") {
      return errorFormAction({
        message: "English localization cannot be removed",
        additionalInfo: { appMetadataId, locale },
        team_id: teamId,
        app_id: appId,
        logLevel: "warn",
      });
    }

    const isUserAllowedToDeleteLocalisation =
      await getIsUserAllowedToDeleteLocalisation(appMetadataId, locale);
    if (!isUserAllowedToDeleteLocalisation) {
      return errorFormAction({
        message:
          "The user does not have permission to delete this localisation",
        team_id: teamId,
        app_id: appId,
        logLevel: "warn",
      });
    }

    const client = await getAPIServiceGraphqlClient();
    await getDeleteLocalisationSdk(client).DeleteLocalisation({
      app_metadata_id: appMetadataId,
      locale,
    });

    return {
      success: true,
      message: "Localisation deleted successfully",
    };
  } catch (error) {
    return errorFormAction({
      error: error as Error,
      message: "An error occurred while deleting the localisation",
      additionalInfo: { appMetadataId, locale },
      team_id: teamId,
      app_id: appId,
      logLevel: "error",
    });
  }
}

export async function addEmptyLocalisationServerSide(
  appMetadataId: string,
  locale: string,
  appId: string,
): Promise<FormActionResult> {
  const path = getPathFromHeaders() || "";
  const { Teams: teamId } = extractIdsFromPath(path, ["Teams"]);

  try {
    const isUserAllowedToInsertLocalisation =
      await getIsUserAllowedToInsertLocalisation(appId);
    if (!isUserAllowedToInsertLocalisation) {
      return errorFormAction({
        message:
          "The user does not have permission to create localisations for this app",
        team_id: teamId,
        app_id: appId,
        logLevel: "warn",
      });
    }

    // Check if localization already exists
    const client = await getAPIServiceGraphqlClient();
    const { localisations } = await getFetchLocalisationSdk(
      client,
    ).FetchLocalisation({
      id: appMetadataId,
      locale,
    });

    if (localisations.length > 0) {
      // Localization already exists, return early
      return {
        success: true,
        message: "Localisation already exists",
      };
    }

    // Create new localization
    await getInsertLocalisationSdk(client).InsertLocalisation({
      input: {
        app_metadata_id: appMetadataId,
        locale,
      },
    });

    return {
      success: true,
      message: "Localisation created successfully",
    };
  } catch (error) {
    return errorFormAction({
      error: error as Error,
      message: "An error occurred while creating the localisation",
      additionalInfo: { appMetadataId, locale },
      team_id: teamId,
      app_id: appId,
      logLevel: "error",
    });
  }
}
