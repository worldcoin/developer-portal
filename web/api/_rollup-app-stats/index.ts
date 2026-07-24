// app/api/cron/rollup-app-stats/route.ts
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { protectInternalEndpoint } from "@/api/helpers/utils";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { getSdk as getRollupVerificationStatsSdk } from "./graphql/rollup-verification-stats.generated";

export async function POST(request: NextRequest) {
  const { isAuthenticated, errorResponse } = protectInternalEndpoint(request);
  if (!isAuthenticated) return errorResponse;

  try {
    // The rollup window is owned by the database watermark; the route only triggers it.
    const client = await getAPIServiceGraphqlClient();
    const sdk = getRollupVerificationStatsSdk(client);

    const res = await sdk.RollupVerificationStats();
    const result = res.rollup_verification_stats?.[0] ?? null;

    logger.info("Rolled up verification stats", { result });
    return NextResponse.json({ success: true, result });
  } catch (error) {
    logger.error("Error rolling up verification stats", { error });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
