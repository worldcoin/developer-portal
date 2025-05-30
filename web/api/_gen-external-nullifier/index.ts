import { protectInternalEndpoint } from "@/api/helpers/utils";
import { generateExternalNullifier } from "@/lib/hashing";
import { NextRequest, NextResponse } from "next/server";
import { getAPIServiceGraphqlClient } from "../helpers/graphql";
import { getSdk as getSetExternalNullifierSdk } from "./graphql/set-external-nulifier.generated";
/**
 * Generates the external nullifier for actions created in the Developer Portal.
 */
export async function POST(request: NextRequest) {
  const { isAuthenticated, errorResponse } = protectInternalEndpoint(request);
  if (!isAuthenticated) {
    return errorResponse;
  }

  const body = await request.json();

  const action = body.event.data.new;

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
