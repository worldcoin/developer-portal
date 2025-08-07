import { errorResponse } from "@/api/helpers/errors";
import { protectInternalEndpoint } from "@/api/helpers/utils";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
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

  if (
    action.external_nullifier &&
    action.external_nullifier !== action.app_id // If it's app_id this is the default sign in action
  ) {
    return NextResponse.json({ success: true, already_generated: true });
  }

  const external_nullifier = generateExternalNullifier(
    action.app_id,
    action.action,
  ).digest;

  const client = await getAPIServiceGraphqlClient();
  const setExternalNullifierSdk = getSetExternalNullifierSdk(client);

  // Mutation will fail anyways if external nullifier is already set due to permissions.
  const response = await setExternalNullifierSdk.SetExternalNullifier({
    action_id: action.id,
    external_nullifier,
  });

  if (response.update_action_by_pk?.external_nullifier === external_nullifier) {
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ success: false, hasura_response: response });
}
