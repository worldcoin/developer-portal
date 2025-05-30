import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { protectInternalEndpoint } from "@/api/helpers/utils";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { getSdk as deleteExpiredAuthCodesSdk } from "./graphql/delete-expired-auth-codes.generated";

export async function POST(request: NextRequest) {
  const { isAuthenticated, errorResponse } = protectInternalEndpoint(request);
  if (!isAuthenticated) {
    return errorResponse;
  }

  logger.info("Starting deletion of expired auth codes.");

  const client = await getAPIServiceGraphqlClient();
  const sdk = deleteExpiredAuthCodesSdk(client);

  const response = await sdk.DeleteExpiredAuthCodes({
    now: new Date().toISOString(),
  });

  logger.info(
    `Deleted ${response.delete_auth_code?.affected_rows} expired auth codes.`,
  );

  return new NextResponse(null, { status: 204 });
}
