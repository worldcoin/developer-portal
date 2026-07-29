import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { protectInternalEndpoint } from "@/api/helpers/utils";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { getSdk } from "./graphql/rollup-v4-analytics.generated";

const isForeignKeyViolation = (error: unknown): boolean => {
  const serialized =
    error instanceof Error ? `${error.name} ${error.message}` : String(error);
  return (
    serialized.includes("foreign key") ||
    serialized.includes("23503") ||
    serialized.includes("constraint-violation")
  );
};

export async function POST(request: NextRequest) {
  const { isAuthenticated, errorResponse } = protectInternalEndpoint(request);
  if (!isAuthenticated) return errorResponse;

  try {
    const client = await getAPIServiceGraphqlClient();
    const sdk = getSdk(client);
    let result;

    try {
      result = await sdk.RollupV4Analytics();
    } catch (error) {
      if (!isForeignKeyViolation(error)) throw error;
      result = await sdk.RollupV4Analytics();
    }

    const rows = result.rollup_v4_analytics ?? [];
    if (rows.length === 0) {
      logger.info("V4 analytics rollup skipped because the lock is held");
      return NextResponse.json({ success: true, processed_through: null });
    }

    const processedThrough = rows.find(
      (row) => row.key === "processed_through",
    );
    logger.info("Rolled up v4 analytics", { processedThrough });
    return NextResponse.json({
      success: true,
      processed_through: processedThrough ?? null,
    });
  } catch (error) {
    logger.error("Error rolling up v4 analytics", { error });
    return NextResponse.json(
      { success: false, error: "V4 analytics rollup failed" },
      { status: 500 },
    );
  }
}
