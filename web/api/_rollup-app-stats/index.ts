// app/api/cron/rollup-app-stats/route.ts
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { protectInternalEndpoint } from "@/api/helpers/utils";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { getSdk as getRollupAppStatsSdk } from "./graphql/rollup-app-stats.generated";

function utcStartOfHour(d: Date) {
  return new Date(
    Date.UTC(
      d.getUTCFullYear(),
      d.getUTCMonth(),
      d.getUTCDate(),
      d.getUTCHours(),
      0,
      0,
      0,
    ),
  );
}

export async function POST(request: NextRequest) {
  const { isAuthenticated, errorResponse } = protectInternalEndpoint(request);
  if (!isAuthenticated) return errorResponse;

  try {
    // define [since, until) as the previous hour in UTC
    const now = new Date();
    const until = utcStartOfHour(now); // top of current hour
    const since = new Date(until.getTime() - 60 * 60 * 1000); // one hour earlier

    const client = await getAPIServiceGraphqlClient();
    const sdk = getRollupAppStatsSdk(client);

    const res = await sdk.RollupAppStats({
      since: since.toISOString(),
      until: until.toISOString(),
    });

    const rows = res.rollup_app_stats ?? [];
    logger.info("Rolled up app stats", { rows });
    return NextResponse.json({
      success: true,
      window: { since: since.toISOString(), until: until.toISOString() },
      updated_rows: rows.length,
    });
  } catch (error) {
    logger.error("Error rolling up app stats", { error });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
