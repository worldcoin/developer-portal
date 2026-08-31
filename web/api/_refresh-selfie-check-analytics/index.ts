import { protectInternalEndpoint } from "@/api/helpers/utils";
import {
  AnalyticsRedisDataError,
  AnalyticsRedisUnavailableError,
} from "@/api/helpers/selfie-check-analytics/redis-store";
import { refreshSelfieCheckAnalyticsRedis } from "@/api/helpers/selfie-check-analytics/refresh-redis";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { isAuthenticated, errorResponse } = protectInternalEndpoint(request);
  if (!isAuthenticated) return errorResponse!;

  const startedAt = Date.now();
  try {
    await refreshSelfieCheckAnalyticsRedis();
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const isRedisError =
      error instanceof AnalyticsRedisUnavailableError ||
      error instanceof AnalyticsRedisDataError;

    logger.error("Failed to refresh selfie-check analytics Redis snapshots", {
      dependency: isRedisError ? "redis" : "s3",
      failureClass:
        error instanceof Error ? error.name : "UnknownAnalyticsRefreshError",
      durationMs: Date.now() - startedAt,
      requestId: request.headers.get("x-request-id") ?? undefined,
      error,
    });

    return NextResponse.json(
      { error: "analytics_refresh_dependency_unavailable" },
      {
        status: 503,
        headers: { "Retry-After": "60" },
      },
    );
  }
}
