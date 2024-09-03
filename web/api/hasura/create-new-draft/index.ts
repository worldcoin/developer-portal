import { errorHasuraQuery } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { protectInternalEndpoint } from "@/api/helpers/utils";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { logger } from "@/lib/logger";
import { getImageEndpoint } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { getSdk as getCreateDraftSdk } from "./graphql/create-draft.generated";
import { getSdk as getCreateLocalisation } from "./graphql/create-localisation.generated";
import { getSdk as getFetchLocalisations } from "./graphql/fetch-localisations.generated";
import { getSdk as getFetchMetadata } from "./graphql/fetch-metadata.generated";

const schema = yup.object({
  app_id: yup.string().strict().required(),
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
  if (body?.action.name !== "create_new_draft") {
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

  const { app_id, team_id } = parsedParams;

  if (!app_id) {
    return errorHasuraQuery({
      req,
      detail: "app_id must be set.",
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

  // Checks that the user is on the team
  const { app } = await getFetchMetadata(client).FetchAppMetadata({
    app_id: app_id,
    team_id: team_id,
    user_id: userId,
  });

  if (!app) {
    return errorHasuraQuery({
      req,
      detail: "App not found",
      code: "app_not_found",
    });
  }

  const appMetadata = app[0];

  // Anchor: Create Draft
  const { id, __typename, ...newAppMetadata } =
    appMetadata.verified_app_metadata[0];

  const { insert_app_metadata_one } = await getCreateDraftSdk(
    client,
  ).CreateDraft({
    ...newAppMetadata,
    verification_status: "unverified",
    logo_img_url: newAppMetadata?.logo_img_url
      ? `logo_img.${getImageEndpoint(newAppMetadata.logo_img_url)}`
      : "",
    hero_image_url: newAppMetadata?.hero_image_url
      ? `hero_image.${getImageEndpoint(newAppMetadata.hero_image_url)}`
      : "",
    showcase_img_urls: newAppMetadata?.showcase_img_urls
      ? `{${newAppMetadata.showcase_img_urls
          ?.map(
            (img: string, index: number) =>
              `showcase_img_${index + 1}.${getImageEndpoint(img)}`,
          )
          .join(",")}}`
      : null,
  });

  if (!insert_app_metadata_one) {
    return errorHasuraQuery({
      req,
      detail: "Failed to create draft",
      code: "create_draft_failed",
    });
  }

  const newAppMetadataId = insert_app_metadata_one.id;

  // Anchor: Fetch and Copy Localisations
  const { localisations } = await getFetchLocalisations(
    client,
  ).FetchLocalisations({
    id: appMetadata.verified_app_metadata[0].id,
  });

  // If localisations exist copy them over
  if (localisations) {
    for (const localisation of localisations) {
      const { id, __typename, ...copiedLocalisation } = localisation;
      await getCreateLocalisation(client).CreateLocalisation({
        input: {
          ...copiedLocalisation,
          app_metadata_id: newAppMetadataId,
        },
      });
    }
  }

  return NextResponse.json({ success: true });
};
