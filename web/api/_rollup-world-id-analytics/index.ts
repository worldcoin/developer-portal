import {
  getAPIServiceGraphqlClient,
  type GraphqlFetchPolicy,
} from "@/api/helpers/graphql";
import { protectInternalEndpoint } from "@/api/helpers/utils";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { getSdk as getEarliestNullifiersSdk } from "./graphql/get-earliest-nullifiers.generated";
import { getSdk as getRollupSdk } from "./graphql/rollup-world-id-analytics.generated";

// Every tick rebuilds the trailing window, then advances the one-time history
// backfill: a Redis cursor walks day chunks from the earliest raw row up to
// yesterday, so completed chunks are never re-rolled. Once production logs
// report the backfill complete, delete the catch-up half and keep the
// trailing-window rollup only.
const BACKFILL_CHUNK_DAYS = 10;
const BACKFILL_CURSOR_KEY = "world-id-analytics:rollup:processed-through";
const BACKFILL_CURSOR_TTL_SECONDS = 2 * 24 * 60 * 60;

// Stop starting chunks well before the cron webhook's 840s timeout, leaving
// headroom for the chunk already in flight plus the response.
const TIME_BUDGET_MS = 12 * 60 * 1000;

const DAY_MS = 24 * 60 * 60 * 1000;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// A chunk rebuilds up to ten UTC days of history; the default 15s abort would
// give up client-side while the SQL still commits, stalling the cursor on a
// chunk that keeps timing out.
const rollupFetchPolicy: GraphqlFetchPolicy = {
  clientName: "world_id_analytics_rollup",
  retryBackoffsMs: [],
  timeoutMs: 120_000,
};

type BackfillStatus = {
  chunks: number;
  complete: boolean;
  processed_through: string | null;
  failed_range?: { from_date: string; to_date: string; error: string };
  skipped?: "redis_unavailable";
};

const formatUtcDate = (date: Date) => date.toISOString().slice(0, 10);

const addDays = (date: string, days: number) =>
  formatUtcDate(
    new Date(new Date(`${date}T00:00:00.000Z`).getTime() + days * DAY_MS),
  );

// The service JWT behind the client lives one minute, so every chunk gets a
// fresh client rather than one client outliving its credential mid-loop.
const rollupWindow = async (variables: {
  from_date: string | null;
  to_date: string | null;
}) => {
  const client = await getAPIServiceGraphqlClient(rollupFetchPolicy);
  const result = await getRollupSdk(client).RollupWorldIdAnalytics(variables);
  const days = result.rollup_world_id_analytics;
  const total = days.reduce(
    (sum, day) => sum + BigInt(day.unique_count),
    BigInt(0),
  );
  return { days: days.length, total: total.toString() };
};

const earliestRawDate = async () => {
  const client = await getAPIServiceGraphqlClient(rollupFetchPolicy);
  const result = await getEarliestNullifiersSdk(client).GetEarliestNullifiers();
  const candidates = [
    result.nullifier[0]?.created_at,
    result.nullifier_v4[0]?.created_at,
  ]
    .filter((value): value is string => typeof value === "string")
    .map((iso) => iso.slice(0, 10));
  return candidates.sort()[0] ?? null;
};

const advanceBackfill = async (
  startedAtMs: number,
): Promise<BackfillStatus> => {
  const redis = global.RedisClient;
  const yesterday = formatUtcDate(new Date(Date.now() - DAY_MS));

  if (!redis) {
    logger.warn("World ID analytics backfill skipped — Redis unavailable");
    return {
      chunks: 0,
      complete: false,
      processed_through: null,
      skipped: "redis_unavailable",
    };
  }

  const stored = await redis.get(BACKFILL_CURSOR_KEY);
  let cursor: string;

  if (stored !== null && ISO_DATE.test(stored)) {
    cursor = stored;
  } else {
    const earliest = await earliestRawDate();
    cursor = earliest === null ? yesterday : addDays(earliest, -1);
    await redis.set(
      BACKFILL_CURSOR_KEY,
      cursor,
      "EX",
      BACKFILL_CURSOR_TTL_SECONDS,
    );
  }

  let chunks = 0;
  while (cursor < yesterday) {
    if (Date.now() - startedAtMs >= TIME_BUDGET_MS) {
      return { chunks, complete: false, processed_through: cursor };
    }

    const upper = addDays(cursor, BACKFILL_CHUNK_DAYS);
    const chunk = {
      from_date: addDays(cursor, 1),
      to_date: upper < yesterday ? upper : yesterday,
    };

    try {
      const rolled = await rollupWindow(chunk);
      chunks += 1;
      cursor = chunk.to_date;
      await redis.set(
        BACKFILL_CURSOR_KEY,
        cursor,
        "EX",
        BACKFILL_CURSOR_TTL_SECONDS,
      );
      logger.info("Advanced World ID analytics backfill", {
        outcome: "chunk_advanced",
        ...chunk,
        ...rolled,
      });
    } catch (error) {
      logger.error("World ID analytics backfill chunk failed", {
        ...chunk,
        error,
      });
      return {
        chunks,
        complete: false,
        processed_through: cursor,
        failed_range: {
          ...chunk,
          error: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  return { chunks, complete: true, processed_through: cursor };
};

export async function POST(request: NextRequest) {
  const auth = protectInternalEndpoint(request);
  if (!auth.isAuthenticated) return auth.errorResponse!;

  if (process.env.WORLD_ID_ANALYTICS_ROLLUP_ENABLED !== "true") {
    return NextResponse.json({ success: true, outcome: "disabled" });
  }

  const startedAtMs = Date.now();

  try {
    const rolled = await rollupWindow({ from_date: null, to_date: null });
    const backfill = await advanceBackfill(startedAtMs);

    if (backfill.failed_range) {
      return NextResponse.json(
        {
          success: false,
          outcome: "advanced",
          ...rolled,
          backfill,
          error: backfill.failed_range.error,
        },
        { status: 500 },
      );
    }

    logger.info("Rolled up World ID analytics", {
      outcome: "advanced",
      ...rolled,
      backfill,
    });
    return NextResponse.json({
      success: true,
      outcome: "advanced",
      ...rolled,
      backfill,
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
