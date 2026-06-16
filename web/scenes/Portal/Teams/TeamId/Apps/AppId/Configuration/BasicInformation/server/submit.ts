"use server";

import { errorFormAction } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import {
  getIsUserAllowedToUpdateApp,
  getIsUserAllowedToUpdateAppMetadata,
} from "@/lib/permissions";
import { extractIdsFromPath, getPathFromHeaders } from "@/lib/server-utils";
import { FormActionResult } from "@/lib/types";
import { schema } from "../form-schema";
import { getSdk as getUpdateAppSdk } from "../graphql/server/update-app.generated";

export async function validateAndSubmitServerSide(
  app_metadata_id: string,
  app_id: string,
  input: {
    name?: string | null;
    integration_url?: string | null;
    app_website_url?: string | null;
  },
): Promise<FormActionResult> {
  const path = (await getPathFromHeaders()) || "";
  const { Teams: teamId } = extractIdsFromPath(path, ["Teams"]);

  try {
    const isUserAllowedToUpdateAppMetadata =
      await getIsUserAllowedToUpdateAppMetadata(app_metadata_id);
    if (!isUserAllowedToUpdateAppMetadata) {
      return errorFormAction({
        message:
          "The user does not have permission to update this app metadata",
        app_id: app_id ?? undefined,
        team_id: teamId,
        logLevel: "warn",
      });
    }

    const isUserAllowedToUpdateApp = await getIsUserAllowedToUpdateApp(app_id);
    if (!isUserAllowedToUpdateApp) {
      return errorFormAction({
        message: "The user does not have permission to update this app",
        app_id,
        team_id: teamId,
        logLevel: "warn",
      });
    }

    const { isValid, parsedParams: parsedInput } = await validateRequestSchema({
      schema,
      value: input,
    });

    if (!isValid || !parsedInput) {
      return errorFormAction({
        message: "The provided app metadata basic information is invalid",
        additionalInfo: { app_metadata_id, input },
        team_id: teamId,
        app_id: app_id ?? undefined,
        logLevel: "warn",
      });
    }

    const client = await getAPIServiceGraphqlClient();
    await getUpdateAppSdk(client).UpdateAppInfo({
      app_metadata_id,
      // Distinguish "field not present in this submission" (undefined → don't
      // touch column) from "user cleared the field" (empty string → persist
      // empty). The schema permits clearing during draft autosave; we must
      // forward that to the DB rather than silently dropping the empty value.
      input: {
        ...(parsedInput.name != null && { name: parsedInput.name }),
        ...(parsedInput.integration_url != null && {
          integration_url: parsedInput.integration_url,
        }),
        ...(parsedInput.app_website_url != null && {
          app_website_url: parsedInput.app_website_url,
        }),
      },
    });

    return {
      success: true,
      message: "App information updated successfully",
    };
  } catch (error) {
    // Hasura rejects malformed client input (e.g. an invalid integration_url
    // that fails the DB's URL/format check) with a GraphQL "data-exception" or
    // "constraint-violation". These are bad-client input, not server faults.
    // "validation-failed" is deliberately excluded: the UpdateAppInfo document
    // is generated and the inputs are plain strings, so that code can only mean
    // the GraphQL operation no longer validates against Hasura (schema /
    // generated-query drift) — a deployment fault that must stay in Error
    // Tracking.
    const hasuraCode = (
      error as {
        response?: { errors?: { extensions?: { code?: unknown } }[] };
      }
    )?.response?.errors?.[0]?.extensions?.code;

    if (
      typeof hasuraCode === "string" &&
      ["data-exception", "constraint-violation"].includes(hasuraCode)
    ) {
      // Log at warn and DO NOT attach the raw Error. The logger tags the active
      // APM span with an error whenever an Error instance is attached (any log
      // level) or whenever the level is "error" — and that span tag is what
      // feeds Datadog Error Tracking. Passing the details as plain strings keeps
      // a useful warn log without fingerprinting an expected validation
      // rejection, mirroring the errorHasuraQuery warn calls elsewhere.
      return errorFormAction({
        message: "An error occurred while updating the app information",
        additionalInfo: {
          app_metadata_id,
          input,
          hasuraCode,
          hasuraMessage: error instanceof Error ? error.message : String(error),
        },
        team_id: teamId,
        app_id: app_id ?? undefined,
        logLevel: "warn",
      });
    }

    return errorFormAction({
      message: "An error occurred while updating the app information",
      error: error as Error,
      additionalInfo: { app_metadata_id, input },
      team_id: teamId,
      app_id: app_id ?? undefined,
      logLevel: "error",
    });
  }
}
