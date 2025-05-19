import { errorNotAllowed } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { protectInternalEndpoint } from "@/api/helpers/utils";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { getSdk as deleteExpiredNotificationLogsSdk } from "./graphql/delete-expired-notification-logs-batch.generated";
import { getSdk as getExpiredNotificationLogIdsBatchSdk } from "./graphql/get-expired-notification-log-ids-batch.generated";

export const POST = async (req: NextRequest) => {
  const { isAuthenticated, errorResponse } = protectInternalEndpoint(req);
  if (!isAuthenticated) {
    return errorResponse;
  }

  if (req.method !== "POST") {
    return errorNotAllowed(req.method, req);
  }

  try {
    const serviceClient = await getAPIServiceGraphqlClient();
    const fourWeeksAgo = new Date(Date.now() - 4 * 7 * 24 * 60 * 60 * 1000);

    const batch = await getExpiredNotificationLogIdsBatchSdk(
      serviceClient,
    ).GetExpiredNotificationLogIdsBatch({
      beforeDate: fourWeeksAgo.toISOString(),
    });

    // apart from removing these rows, the query also deletes the corresponding notification_log_wallet_address rows
    await deleteExpiredNotificationLogsSdk(
      serviceClient,
    ).DeleteExpiredNotificationLogs({
      notificationLogIds: batch.notification_log.map((log) => log.id),
    });
  } catch (error) {
    logger.error("Failed to delete expired notification logs", {
      error,
    });
  }

  return NextResponse.json(
    {
      success: true,
    },
    { status: 200 },
  );
};
