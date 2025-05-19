import { _deleteExpiredJWKs } from "@/api/helpers/jwks";
import { protectInternalEndpoint } from "@/api/helpers/utils";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";

/**
 * Deletes expired JWKs
 */
export async function POST(request: NextRequest) {
  if (!protectInternalEndpoint(request)) {
    return;
  }

  logger.info("Starting deletion of expired jwks.");

  const response = await _deleteExpiredJWKs();

  logger.info(`Deleted ${response} expired jwks.`);

  return new NextResponse(null, { status: 204 });
}
