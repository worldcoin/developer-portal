import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { protectInternalEndpoint } from "@/api/helpers/utils";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { getSdk } from "./graphql/rollup-world-id-analytics.generated";

export async function POST(request: NextRequest) {
  const auth = protectInternalEndpoint(request);
  if (!auth.isAuthenticated) return auth.errorResponse!;

  if (process.env.WORLD_ID_ANALYTICS_ROLLUP_ENABLED !== "true") {
    return NextResponse.json({ success: true, skipped: "disabled" });
  }

  try {
    const client = await getAPIServiceGraphqlClient();
    const result = await getSdk(client).RollupWorldIdAnalytics();
    logger.info("Rolled up World ID analytics", {
      acquired: result.rollup_world_id_analytics.length > 0,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error rolling up World ID analytics", { error });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
