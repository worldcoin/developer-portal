import { protectInternalEndpoint } from "@/api/helpers/utils";
import { NextRequest, NextResponse } from "next/server";
import { getAPIServiceGraphqlClient } from "../helpers/graphql";
import { getSdk as getIncrementAppStatsSdk } from "./graphql/increment-app-stats.generated";

/**
 * Handles Hasura event to increment app stats when a nullifier is inserted or updated.
 * Assumes each insert is the first verification (per user/action), and each update is another usage.
 * In both cases, stats are updated based on the current verification timestamp.
 */
export async function POST(request: NextRequest) {
  const { isAuthenticated, errorResponse } = protectInternalEndpoint(request);
  if (!isAuthenticated) {
    return errorResponse;
  }

  const body = await request.json();
  const nullifier = body.event.data.new;
  const timestamp =
    body.event.data.new.updated_at || body.event.data.new.created_at;

  if (!nullifier?.nullifier_hash || !timestamp || !nullifier?.action_id) {
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
      timestamp: timestamp,
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
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
