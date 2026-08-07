import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { protectInternalEndpoint } from "@/api/helpers/utils";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { getSdk } from "./graphql/rollup-world-id-analytics.generated";

// Dated (backfill/repair) calls: bounds chosen so one call always finishes
// comfortably inside the HTTP request that carries it.
const MAX_RANGE_DAYS = 92;
const DEFAULT_CHUNK_DAYS = 10;
const MAX_CHUNK_DAYS = 31;

const DAY_MS = 24 * 60 * 60 * 1000;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

type DatedRequest = {
  chunkDays: number;
  fromDate: string;
  toDate: string;
};

type Chunk = { from_date: string; to_date: string };

const parseUtcDate = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.toISOString().slice(0, 10) === value ? parsed : null;
};

const formatUtcDate = (date: Date) => date.toISOString().slice(0, 10);

const splitIntoChunks = (request: DatedRequest): Chunk[] => {
  const from = parseUtcDate(request.fromDate)!;
  const to = parseUtcDate(request.toDate)!;
  const chunks: Chunk[] = [];

  for (
    let start = from.getTime();
    start <= to.getTime();
    start += request.chunkDays * DAY_MS
  ) {
    const end = Math.min(
      start + (request.chunkDays - 1) * DAY_MS,
      to.getTime(),
    );
    chunks.push({
      from_date: formatUtcDate(new Date(start)),
      to_date: formatUtcDate(new Date(end)),
    });
  }
  return chunks;
};

const badRequest = (message: string) =>
  NextResponse.json({ success: false, error: message }, { status: 400 });

const validateDatedRequest = (
  body: Record<string, unknown>,
): { error: NextResponse } | { request: DatedRequest } => {
  const { from_date, to_date, chunk_days } = body;

  if (typeof from_date !== "string" || typeof to_date !== "string") {
    return { error: badRequest("from_date and to_date must both be set") };
  }
  if (!ISO_DATE.test(from_date) || !parseUtcDate(from_date)) {
    return { error: badRequest("from_date must be a valid YYYY-MM-DD date") };
  }
  if (!ISO_DATE.test(to_date) || !parseUtcDate(to_date)) {
    return { error: badRequest("to_date must be a valid YYYY-MM-DD date") };
  }

  const spanDays =
    (parseUtcDate(to_date)!.getTime() - parseUtcDate(from_date)!.getTime()) /
      DAY_MS +
    1;
  if (spanDays < 1) {
    return { error: badRequest("from_date must not be after to_date") };
  }
  if (spanDays > MAX_RANGE_DAYS) {
    return {
      error: badRequest(
        `range must be at most ${MAX_RANGE_DAYS} days per call; split it`,
      ),
    };
  }

  let chunkDays = DEFAULT_CHUNK_DAYS;
  if (chunk_days !== undefined) {
    if (
      typeof chunk_days !== "number" ||
      !Number.isInteger(chunk_days) ||
      chunk_days < 1 ||
      chunk_days > MAX_CHUNK_DAYS
    ) {
      return {
        error: badRequest(
          `chunk_days must be an integer between 1 and ${MAX_CHUNK_DAYS}`,
        ),
      };
    }
    chunkDays = chunk_days;
  }

  return { request: { chunkDays, fromDate: from_date, toDate: to_date } };
};

// The service JWT behind the client lives one minute, so every chunk gets a
// fresh client rather than one client outliving its credential mid-loop.
const rollupWindow = async (variables: {
  from_date: string | null;
  to_date: string | null;
}) => {
  const client = await getAPIServiceGraphqlClient();
  const result = await getSdk(client).RollupWorldIdAnalytics(variables);
  const days = result.rollup_world_id_analytics;
  const total = days.reduce(
    (sum, day) => sum + BigInt(day.unique_count),
    BigInt(0),
  );
  return { days: days.length, total: total.toString() };
};

const runDatedBackfill = async (request: DatedRequest) => {
  const chunks = splitIntoChunks(request);
  const failedRanges: Array<Chunk & { error: string }> = [];

  for (const chunk of chunks) {
    try {
      const rolled = await rollupWindow(chunk);
      logger.info("Rolled up World ID analytics chunk", {
        outcome: "chunk_advanced",
        ...chunk,
        ...rolled,
      });
    } catch (error) {
      failedRanges.push({
        ...chunk,
        error: error instanceof Error ? error.message : String(error),
      });
      logger.error("World ID analytics chunk failed", { ...chunk, error });
    }
  }

  return NextResponse.json({
    success: failedRanges.length === 0,
    chunks: chunks.length,
    failed_ranges: failedRanges,
  });
};

export async function POST(request: NextRequest) {
  const auth = protectInternalEndpoint(request);
  if (!auth.isAuthenticated) return auth.errorResponse!;

  const body: unknown = await request.json().catch(() => ({}));
  const fields =
    body && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : {};

  // Dated mode: operator-driven backfill/repair. Deliberately not behind the
  // rollout flag so history can be built and re-verified before the recurring
  // rollup is ever enabled; the internal secret still gates it.
  if (fields.from_date !== undefined || fields.to_date !== undefined) {
    const validated = validateDatedRequest(fields);
    if ("error" in validated) return validated.error;
    return runDatedBackfill(validated.request);
  }

  // Cron mode: rebuild the standard trailing window.
  if (process.env.WORLD_ID_ANALYTICS_ROLLUP_ENABLED !== "true") {
    return NextResponse.json({ success: true, outcome: "disabled" });
  }

  try {
    const rolled = await rollupWindow({ from_date: null, to_date: null });
    logger.info("Rolled up World ID analytics", {
      outcome: "advanced",
      ...rolled,
    });
    return NextResponse.json({ success: true, outcome: "advanced", ...rolled });
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
