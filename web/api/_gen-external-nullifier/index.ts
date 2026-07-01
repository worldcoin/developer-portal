import { errorResponse } from "@/api/helpers/errors";
import { protectInternalEndpoint } from "@/api/helpers/utils";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { APPS_WITH_CUSTOM_EXTERNAL_NULLIFIER } from "@/lib/constants";
import { generateExternalNullifier } from "@/lib/hashing";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { getAPIServiceGraphqlClient } from "../helpers/graphql";
import { getSdk as getSetExternalNullifierSdk } from "./graphql/set-external-nulifier.generated";

const schema = yup.object({
  event: yup.object({
    data: yup.object({
      new: yup.object({
        app_id: yup.string().required(),
        action: yup.string().optional(),
        external_nullifier: yup.string().optional(),
        id: yup.string().required(),
      }),
    }),
  }),
});

/**
 * Generates the external nullifier for actions created in the Developer Portal.
 */
export async function POST(request: NextRequest) {
  const { isAuthenticated, errorResponse: unauthenticatedError } =
    protectInternalEndpoint(request);
  if (!isAuthenticated) {
    return unauthenticatedError;
  }

  let body;
  try {
    body = await request.json();
  } catch (error) {
    const body = await request.text();
    logger.warn("Invalid JSON in request body", { error, body });

    return errorResponse({
      statusCode: 400,
      code: "invalid_request",
      detail: "Invalid JSON in request body",
      attribute: null,
      req: request,
    });
  }

  const { isValid, parsedParams, handleError } = await validateRequestSchema({
    schema,
    value: body,
  });

  if (!isValid) {
    return handleError(request);
  }

  const action = parsedParams.event.data.new;

  // Apps that legitimately use a custom external_nullifier keep their stored
  // value — but only for real custom values. The default sign-in action is
  // seeded with external_nullifier == app_id; that sentinel must still be
  // normalized to hash(app_id, "") (precheck looks it up that way), so it is
  // excluded here. For every other app the portal is the sole authority:
  // recompute and overwrite so a client-supplied external_nullifier (e.g. one
  // inserted directly via the api_key GraphQL role) cannot pin an arbitrary
  // proof domain instead of the canonical hash(app_id, action).
  if (
    APPS_WITH_CUSTOM_EXTERNAL_NULLIFIER.includes(action.app_id) &&
    action.external_nullifier &&
    action.external_nullifier !== action.app_id
  ) {
    return NextResponse.json({
      success: true,
      custom_external_nullifier: true,
    });
  }

  const external_nullifier = generateExternalNullifier(
    action.app_id,
    action.action,
  ).digest;

  const client = await getAPIServiceGraphqlClient();
  const setExternalNullifierSdk = getSetExternalNullifierSdk(client);

  // Runs as the service role, which overwrites any existing value so a
  // client-supplied external_nullifier cannot persist.
  const response = await setExternalNullifierSdk.SetExternalNullifier({
    action_id: action.id,
    external_nullifier,
  });

  if (response.update_action_by_pk?.external_nullifier === external_nullifier) {
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ success: false, hasura_response: response });
}
