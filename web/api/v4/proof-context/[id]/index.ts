import { errorResponse } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { isValidRpId } from "@/api/helpers/rp-utils";
import { corsHandler } from "@/api/helpers/utils";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { getCDNImageUrl } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { getSdk as getFetchActionV4Sdk } from "./graphql/fetch-action-v4.generated";
import { getSdk as getFetchAppByAppIdSdk } from "./graphql/fetch-app-by-app-id.generated";
import { getSdk as getFetchAppByRpIdSdk } from "./graphql/fetch-app-by-rp-id.generated";

/**
 * Request body schema for v4 proof-context
 * - action: required action identifier
 */
const schema = yup
  .object()
  .shape({
    action: yup
      .string()
      .strict()
      .required("This attribute is required."),
  })
  .noUnknown();

const corsMethods = ["POST", "OPTIONS"];

/**
 * Response type for v4 proof-context endpoint
 */
type ProofContextResponse = {
  app_id: string;
  rp_id: string;
  name: string;
  is_verified: boolean;
  verified_app_logo: string;
  integration_url: string;
  action: {
    action: string;
    description: string;
    environment: "staging" | "production";
  };
};

/**
 * V4 Proof Context Endpoint
 *
 * Fetches public metadata for an app & action for World ID 4.0.
 * Called by authenticators before rendering proof request modals.
 *
 * Key features:
 * - Accepts both app_id (app_xxx) and rp_id (rp_xxx) formats in URL
 * - Simplified request body (only action required)
 * - Returns app metadata (name, logo, verification status)
 * - Returns action environment ("staging" | "production")
 * - If action doesn't exist, returns synthetic action (not saved to DB)
 */
export async function POST(
  req: NextRequest,
  { params: routeParams }: { params: { id: string } },
) {
  const body = await req.json();
  const { isValid, parsedParams, handleError } = await validateRequestSchema({
    schema,
    value: body,
  });

  if (!isValid) {
    return corsHandler(handleError(req), corsMethods);
  }

  const id = routeParams.id;
  const action = parsedParams.action;

  if (!id) {
    return corsHandler(
      errorResponse({
        statusCode: 400,
        code: "invalid_request",
        detail: "App ID or RP ID is required.",
        attribute: "id",
        req,
      }),
      corsMethods,
    );
  }

  const client = await getAPIServiceGraphqlClient();

  // Determine if ID is rp_id or app_id format
  const isRpId = isValidRpId(id);

  let appData: {
    id: string;
    is_staging: boolean;
    app_metadata: Array<{ name: string; integration_url: string }>;
    verified_app_metadata: Array<{ name: string; logo_img_url: string; integration_url: string }>;
  } | null = null;

  let rpRegistration: {
    rp_id: string;
    status: string;
  } | null = null;

  if (isRpId) {
    // Fetch by rp_id
    const result = await getFetchAppByRpIdSdk(client).FetchAppByRpId({ rp_id: id });
    const registration = result.rp_registration[0];

    if (!registration) {
      return corsHandler(
        errorResponse({
          statusCode: 404,
          code: "not_found",
          detail: "RP not found. The RP ID may be invalid.",
          attribute: null,
          req,
        }),
        corsMethods,
      );
    }

    // Check if app is active and not archived
    if (registration.app.status !== "active" || registration.app.is_archived) {
      return corsHandler(
        errorResponse({
          statusCode: 404,
          code: "not_found",
          detail: "App not found. App may be inactive or archived.",
          attribute: null,
          req,
        }),
        corsMethods,
      );
    }

    appData = registration.app;
    rpRegistration = {
      rp_id: registration.rp_id,
      status: registration.status,
    };
  } else {
    // Fetch by app_id
    const result = await getFetchAppByAppIdSdk(client).FetchAppByAppId({ app_id: id });
    const app = result.app[0];

    if (!app) {
      return corsHandler(
        errorResponse({
          statusCode: 404,
          code: "not_found",
          detail: "App not found. App may be inactive or archived.",
          attribute: null,
          req,
        }),
        corsMethods,
      );
    }

    appData = app;
    rpRegistration = app.rp_registration[0] ?? null;
  }

  // Check if RP registration exists and is active
  if (!rpRegistration || !appData) {
    return corsHandler(
      errorResponse({
        statusCode: 400,
        code: "not_registered",
        detail: "This app has not been registered for World ID 4.0.",
        attribute: null,
        req,
      }),
      corsMethods,
    );
  }

  if (rpRegistration.status !== "registered") {
    return corsHandler(
      errorResponse({
        statusCode: 400,
        code: "rp_not_active",
        detail: `RP registration is not active. Current status: ${rpRegistration.status}`,
        attribute: null,
        req,
      }),
      corsMethods,
    );
  }

  // Get app metadata
  const app_metadata = appData.app_metadata[0];
  const verified_app_metadata = appData.verified_app_metadata[0];

  // Build logo URL
  const logo_img_url = verified_app_metadata?.logo_img_url
    ? getCDNImageUrl(appData.id, verified_app_metadata.logo_img_url)
    : "";

  // Fetch action_v4 separately
  const actionResult = await getFetchActionV4Sdk(client).FetchActionV4({
    rp_id: rpRegistration.rp_id,
    action,
  });
  const existingAction = actionResult.action_v4[0];

  const actionResponse = existingAction
    ? {
      action: existingAction.action,
      description: existingAction.description,
      environment: existingAction.environment as "staging" | "production",
    }
    : {
      // Synthetic action - not saved to DB, will be created in /verify endpoint
      action: action,
      description: "",
      environment: "production" as const,
    };

  const response: ProofContextResponse = {
    app_id: appData.id,
    rp_id: rpRegistration.rp_id,
    name: verified_app_metadata?.name ?? app_metadata?.name ?? "",
    is_verified: Boolean(verified_app_metadata),
    verified_app_logo: logo_img_url,
    integration_url:
      verified_app_metadata?.integration_url ??
      app_metadata?.integration_url ??
      "",
    action: actionResponse,
  };

  return corsHandler(NextResponse.json(response, { status: 200 }), corsMethods);
}

export async function OPTIONS(req: NextRequest) {
  return corsHandler(new NextResponse(null, { status: 204 }), corsMethods);
}
