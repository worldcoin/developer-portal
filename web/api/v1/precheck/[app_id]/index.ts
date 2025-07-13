import { errorResponse } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { corsHandler } from "@/api/helpers/utils";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { canVerifyForAction } from "@/api/helpers/verify";
import { generateExternalNullifier } from "@/lib/hashing";
import { CanUserVerifyType, EngineType } from "@/lib/types";
import { getCDNImageUrl } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { getSdk } from "./graphql/app-precheck.generated";

const schema = yup
  .object()
  .shape({
    action: yup.string().strict().default(""),

    nullifier_hash: yup
      .string()
      .nullable()
      .default("")
      .transform((value) => (value === null ? "" : value)),

    external_nullifier: yup
      .string()
      .strict()
      .nullable()
      .when("action", {
        is: (action: unknown) => action === null,
        then: (s) =>
          s.required("This attribute is required when action is not provided."),
      }),
  })
  .noUnknown();

const corsMethods = ["POST", "OPTIONS"];

/**
 * Fetches public metadata for an app & action.
 * Can be used to check whether a user can verify for a particular action.
 * Called by the World App before rendering proof request modals.
 * Called by the kiosk.
 * This endpoint is publicly available.
 */
export async function POST(
  req: NextRequest,
  { params: routeParams }: { params: { app_id: string } },
) {
  const body = await req.json();
  const { isValid, parsedParams, handleError } = await validateRequestSchema({
    schema,
    value: body,
  });

  if (!isValid) {
    return corsHandler(handleError(req), corsMethods);
  }

  const app_id = routeParams.app_id;
  const action = parsedParams.action ?? "";
  const nullifier_hash = parsedParams.nullifier_hash;
  const external_nullifier =
    parsedParams.external_nullifier ??
    generateExternalNullifier(app_id, action).digest;

  const client = await getAPIServiceGraphqlClient();
  const sdk = getSdk(client);

  // ANCHOR: Fetch app from Hasura
  const appQueryResult = await sdk.AppPrecheckQuery({
    app_id,
    nullifier_hash,
    external_nullifier,
  });

  const rawAppValues = appQueryResult.app?.[0];

  if (!rawAppValues) {
    return corsHandler(
      errorResponse({
        statusCode: 404,
        code: "not_found",
        detail: "We couldn't find an app with this ID. Action may be inactive.",
        attribute: null,
        req,
        app_id,
      }),
      corsMethods,
    );
  }

  const app_metadata = rawAppValues.app_metadata[0];
  const verified_app_metadata = rawAppValues.verified_app_metadata[0];
  // If an image is present it should store it's relative path and extension ie logo.png
  const logo_img_url = verified_app_metadata?.logo_img_url
    ? getCDNImageUrl(rawAppValues.id, verified_app_metadata?.logo_img_url)
    : "";

  // Prevent breaking changes
  const app = {
    id: rawAppValues.id,
    engine: rawAppValues.engine,
    is_staging: rawAppValues.is_staging,
    is_verified: verified_app_metadata ? true : false,
    name: verified_app_metadata?.name ?? app_metadata?.name ?? "",
    verified_app_logo: logo_img_url,
    integration_url:
      verified_app_metadata?.integration_url ??
      app_metadata?.integration_url ??
      "",
    actions: rawAppValues.actions,
  };

  // ANCHOR: If the action doesn't exist return error
  if (!app.actions.length) {
    return corsHandler(
      errorResponse({
        statusCode: 400,
        code: "required",
        detail: "No action found for this app.",
        attribute: "action",
        req,
        app_id,
      }),
      corsMethods,
    );
  }

  const actionItem = app.actions[0];

  if (actionItem.status === "inactive") {
    return corsHandler(
      errorResponse({
        statusCode: 400,
        code: "action_inactive",
        detail: "This action is inactive.",
        attribute: "status",
        req,
        app_id,
      }),
      corsMethods,
    );
  }

  const nullifier = actionItem.nullifiers?.[0];

  const response = {
    ...app,
    actions: undefined,
    sign_in_with_world_id: action === "", // DEPRECATED: will be removed in v2
    is_sign_in: action === "",
    action: { ...actionItem, nullifiers: undefined },
    ...(nullifier
      ? {
          nullifier: {
            uses: nullifier?.uses,
          },
        }
      : {}),
    can_user_verify: CanUserVerifyType.Undetermined, // Provides mobile app information on whether to allow the user to verify. By default we cannot determine if the user can verify unless conditions are met.
  };

  if (app.engine === EngineType.OnChain) {
    // On-chain actions uniqueness cannot be verified in the Developer Portal
    response.can_user_verify = CanUserVerifyType.OnChain;
  } else {
    if (response.sign_in_with_world_id) {
      // User can always verify for sign in with World ID
      response.can_user_verify = CanUserVerifyType.Yes;
    }

    // ANCHOR: If a nullifier hash is provided, determine if the user can verify
    if (nullifier_hash && response.action) {
      response.can_user_verify = canVerifyForAction(
        nullifier,
        response.action.max_verifications,
      )
        ? CanUserVerifyType.Yes
        : CanUserVerifyType.No;
    }
  }

  return corsHandler(NextResponse.json(response, { status: 200 }), corsMethods);
}

export async function OPTIONS(req: NextRequest) {
  return corsHandler(new NextResponse(null, { status: 204 }), corsMethods);
}
