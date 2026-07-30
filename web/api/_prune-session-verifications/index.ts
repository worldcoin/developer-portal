import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { protectInternalEndpoint } from "@/api/helpers/utils";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { getSdk } from "./graphql/prune-session-verifications.generated";

export async function POST(request: NextRequest) {
  const { isAuthenticated, errorResponse } = protectInternalEndpoint(request);
  if (!isAuthenticated) return errorResponse;

  try {
    const client = await getAPIServiceGraphqlClient();
    const result = await getSdk(client).PruneSessionVerifications();
    const prunedThrough = result.prune_session_verifications?.[0] ?? null;

    if (prunedThrough) {
      logger.info("Pruned v4 session verification analytics", {
        prunedThrough,
      });
    } else {
      logger.info("V4 session verification prune skipped");
    }

    return NextResponse.json({
      success: true,
      pruned_through: prunedThrough,
    });
  } catch (error) {
    logger.error("Error pruning v4 session verification analytics", { error });
    return NextResponse.json(
      { success: false, error: "Session verification prune failed" },
      { status: 500 },
    );
  }
}
