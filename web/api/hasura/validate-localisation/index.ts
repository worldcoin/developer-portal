import { errorHasuraQuery } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { protectInternalEndpoint } from "@/api/helpers/utils";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { getSdk as getLocalesSdk } from "./graphql/get-locales.generated";
import { getSdk as getLocalisationsSdk } from "./graphql/get-localisations.generated";

const schema = yup.object({
  app_metadata_id: yup.string().strict().required(),
  team_id: yup.string().strict().required(),
});

export const POST = async (req: NextRequest) => {
  if (!protectInternalEndpoint(req)) {
    return errorHasuraQuery({
      req,
      detail: "Internal endpoint",
      code: "internal_endpoint",
    });
  }

  const body = await req.json();

  if (body?.action.name !== "validate_localisation") {
    return errorHasuraQuery({
      req,
      detail: "Invalid action.",
      code: "invalid_action",
    });
  }

  if (!["user", "admin"].includes(body.session_variables["x-hasura-role"])) {
    logger.error("Unauthorized access."),
      { role: body.session_variables["x-hasura-role"] };
    return errorHasuraQuery({ req });
  }

  const userId = body.session_variables["x-hasura-user-id"];

  if (!userId) {
    return errorHasuraQuery({
      req,
      detail: "userId must be set.",
      code: "required",
    });
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

  const { app_metadata_id, team_id } = parsedParams;

  if (!app_metadata_id) {
    return errorHasuraQuery({
      req,
      detail: "app_metadata_id must be set.",
      code: "required",
    });
  }

  if (!team_id) {
    return errorHasuraQuery({
      req,
      detail: "teamId must be set.",
      code: "required",
    });
  }

  const client = await getAPIServiceGraphqlClient();

  // Anchor: Create a new draft

  const { localisations } = await getLocalisationsSdk(client).GetLocalisations({
    app_metadata_id: app_metadata_id,
  });

  // Require that for every language locale we have all fields filled out
  for (const localisation of localisations) {
    if (
      localisation.name &&
      localisation.short_name &&
      localisation.world_app_button_text &&
      localisation.world_app_description &&
      localisation.description
    ) {
      continue;
    } else {
      return errorHasuraQuery({
        req,
        detail: "Missing localisation fields",
        code: "missing_localisation_fields",
      });
    }
  }

  const { app_metadata_by_pk: app_locales } = await getLocalesSdk(
    client,
  ).GetLocales({
    id: app_metadata_id,
  });

  if (app_locales?.supported_languages) {
    const supportedLanguagesWithoutEn = app_locales.supported_languages.filter(
      (lang) => lang !== "en",
    );
    if (
      !supportedLanguagesWithoutEn.every((languageCode) => {
        const matchingLocalization = localisations.find(
          (localisation) => localisation.locale === languageCode,
        );
        return !!matchingLocalization;
      })
    ) {
      return errorHasuraQuery({
        req,
        detail: "Missing localisation for language code",
        code: "missing_localisation",
      });
    }
  }

  return NextResponse.json({ success: true });
};
