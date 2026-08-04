import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { protectInternalEndpoint } from "@/api/helpers/utils";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { getSdk } from "./graphql/rollup-world-id-analytics.generated";

// Bounds how far one cron tick may advance the watermark. Steady state
// rebuilds ~25 hours so the cap never binds; it only bites on catch-up after
// an outage, which then heals 30 days per tick instead of in one unbounded
// transaction.
const MAX_ADVANCE_DAYS = 30;

export async function POST(request: NextRequest) {
  const auth = protectInternalEndpoint(request);
  if (!auth.isAuthenticated) return auth.errorResponse!;

  if (process.env.WORLD_ID_ANALYTICS_ROLLUP_ENABLED !== "true") {
    return NextResponse.json({ success: true, outcome: "disabled" });
  }

  try {
    const client = await getAPIServiceGraphqlClient();
    const result = await getSdk(client).RollupWorldIdAnalytics({
      max_advance_days: MAX_ADVANCE_DAYS,
    });
    const state = result.rollup_world_id_analytics[0];

    if (!state) {
      logger.warn("World ID analytics rollup did not acquire its lock", {
        outcome: "lock_missed",
      });
      return NextResponse.json({ success: true, outcome: "lock_missed" });
    }

    logger.info("Rolled up World ID analytics", {
      outcome: "advanced",
      processed_through: state.processed_through,
    });
    return NextResponse.json({
      success: true,
      outcome: "advanced",
      processed_through: state.processed_through,
    });
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
