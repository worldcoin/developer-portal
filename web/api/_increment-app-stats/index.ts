import { protectInternalEndpoint } from "@/api/helpers/utils";
import { NextRequest, NextResponse } from "next/server";
import { getAPIServiceGraphqlClient } from "../helpers/graphql";
import { getSdk as getIncrementAppStatsSdk } from "./graphql/increment-app-stats.generated";

/**
 * Handles Hasura event to increment app stats when a new nullifier is inserted.
 */
export async function POST(request: NextRequest) {
  const { isAuthenticated, errorResponse } = protectInternalEndpoint(request);
  if (!isAuthenticated) {
    return errorResponse;
  }

  const body = await request.json();
  const nullifier = body.event.data.new;

  if (
    !nullifier?.nullifier_hash ||
    !nullifier?.created_at ||
    !nullifier?.action_id
  ) {
    return NextResponse.json(
      { success: false, error: "Missing required nullifier fields." },
      { status: 400 },
    );
  }

  const client = await getAPIServiceGraphqlClient();
  const incrementAppStatsSdk = getIncrementAppStatsSdk(client);

  try {
    const response = await incrementAppStatsSdk.IncrementAppStats({
      nullifier_hash: nullifier.nullifier_hash,
      created_at: nullifier.created_at,
      action_id: nullifier.action_id,
    });

    if (response.increment_app_stats.length > 0) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({
      success: false,
      message: "Mutation returned no rows",
      hasura_response: response,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error,
      },
      { status: 500 },
    );
  }
}
