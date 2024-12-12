"use server";

import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import {
  getIsUserAllowedToInsertLocalisation,
  getIsUserAllowedToUpdateAppMetadata,
  getIsUserAllowedToUpdateLocalisation,
} from "@/lib/permissions";
import {
  getSdk as getInsertLocalisationSdk,
  InsertLocalisationMutationVariables,
} from "../AppStoreLocalised/graphql/server/insert-localisation.generated";
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
  InsertLocalisationInitialSchema,
  insertLocalisationInitialSchema,
  updateAppLocaleInfoInitialSchema,
  UpdateAppLocaleInfoInitialSchema,
  updateAppSupportInfoInitialSchema,
  UpdateAppSupportInfoInitialSchema,
  UpdateLocalisationInitialSchema,
  updateLocalisationInitialSchema,
} from "../form-schema";

export async function validateAndUpdateLocalisationServerSide(
  params: UpdateLocalisationInitialSchema,
) {
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
      throw new Error("Invalid permissions");
    }

    const { isValid, parsedParams: parsedInitialValues } =
      await validateRequestSchema({
        schema: updateLocalisationInitialSchema,
        value: initalValues,
      });

    if (!isValid || !parsedInitialValues) {
      throw new Error("Invalid input");
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
  } catch (error) {
    console.error(
      "validateAndUpdateLocalisation - error updating localisation",
      {
        error: JSON.stringify(error),
        arguments: { encodedInput: JSON.stringify(encodedInput, null, 2) },
      },
    );
    throw error;
  }
}

export async function validateAndInsertLocalisationServerSide(
  params: InsertLocalisationInitialSchema,
  appId: string,
) {
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
  let encodedInput: InsertLocalisationMutationVariables["input"] = {};
  try {
    const isUserAllowedToInsertLocalisation =
      await getIsUserAllowedToInsertLocalisation(appId);
    if (!isUserAllowedToInsertLocalisation) {
      throw new Error("Invalid permissions");
    }

    const { isValid, parsedParams: parsedInitialValues } =
      await validateRequestSchema({
        schema: insertLocalisationInitialSchema,
        value: initalValues,
      });

    if (!isValid || !parsedInitialValues) {
      throw new Error("Invalid input");
    }

    encodedInput = {
      name: parsedInitialValues.name,
      short_name: parsedInitialValues.short_name,
      world_app_button_text: parsedInitialValues.world_app_button_text,
      world_app_description: parsedInitialValues.world_app_description,
      description: encodeDescription(
        parsedInitialValues.description_overview,
        parsedInitialValues?.description_how_it_works,
        parsedInitialValues?.description_connect,
      ),
      app_metadata_id: parsedInitialValues.app_metadata_id,
      locale: parsedInitialValues.locale,
    };

    const client = await getAPIServiceGraphqlClient();
    await getInsertLocalisationSdk(client).InsertLocalisation({
      input: encodedInput,
    });
  } catch (error) {
    console.error(
      "validateAndInsertLocalisation - error inserting localisation",
      {
        error: JSON.stringify(error),
        arguments: { encodedInput: JSON.stringify(encodedInput, null, 2) },
      },
    );
    throw error;
  }
}

export async function validateAndUpdateAppLocaleInfoServerSide(
  params: UpdateAppLocaleInfoInitialSchema,
) {
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
      throw new Error("Invalid permissions");
    }

    const { isValid, parsedParams: parsedInitialValues } =
      await validateRequestSchema({
        schema: updateAppLocaleInfoInitialSchema,
        value: initalValues,
      });

    if (!isValid || !parsedInitialValues) {
      throw new Error("Invalid input");
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
  } catch (error) {
    console.error(
      "validateAndUpdateAppLocaleInfo - error updating app locale info",
      {
        error: JSON.stringify(error),
        arguments: { encodedInput: JSON.stringify(encodedInput, null, 2) },
      },
    );
    throw error;
  }
}

export async function validateAndUpdateAppSupportInfoServerSide(
  params: UpdateAppSupportInfoInitialSchema,
) {
  const initalValues = {
    app_metadata_id: params.app_metadata_id,
    is_support_email: params.is_support_email,
    support_link: params.support_link,
    support_email: params.support_email,
    app_website_url: params.app_website_url,
    supported_countries: params.supported_countries,
    category: params.category,
  };
  let input: UpdateAppInfoMutationVariables = {
    app_metadata_id: params.app_metadata_id,
  };
  try {
    const isUserAllowedToUpdateAppMetadata =
      await getIsUserAllowedToUpdateAppMetadata(params.app_metadata_id);
    if (!isUserAllowedToUpdateAppMetadata) {
      throw new Error("Invalid permissions");
    }

    const { isValid, parsedParams: parsedInitialValues } =
      await validateRequestSchema({
        schema: updateAppSupportInfoInitialSchema,
        value: initalValues,
      });

    if (!isValid || !parsedInitialValues) {
      throw new Error("Invalid input");
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
      },
    };

    const client = await getAPIServiceGraphqlClient();
    await getUpdateAppInfoSdk(client).UpdateAppInfo(input);
  } catch (error) {
    console.error(
      "validateAndUpdateAppSupportInfo - error updating app support info",
      {
        error: JSON.stringify(error),
        arguments: { input: JSON.stringify(input, null, 2) },
      },
    );
    throw error;
  }
}
