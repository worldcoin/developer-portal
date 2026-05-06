import { errorNotAllowed, errorResponse } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { protectInternalEndpoint } from "@/api/helpers/utils";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { getSdk as deleteExpiredNotificationLogsSdk } from "./graphql/delete-expired-notification-logs-batch.generated";
import { getSdk as getExpiredNotificationLogIdsBatchSdk } from "./graphql/get-expired-notification-log-ids-batch.generated";

const BATCH_SIZE = 100;
const DELAY_MS = 10000;
// Hasura cron timeout is 60s; leave headroom so we exit cleanly instead of
// being aborted mid-batch. Remaining rows are picked up on the next run.
const TIME_BUDGET_MS = 45000;

export const POST = async (req: NextRequest) => {
  const { isAuthenticated, errorResponse: authErrorResponse } =
    protectInternalEndpoint(req);
  if (!isAuthenticated) {
    return authErrorResponse;
  }

  if (req.method !== "POST") {
    return errorNotAllowed(req.method, req);
  }

  try {
    const client = await getAPIServiceGraphqlClient();

    // 4 weeks ago
    const cutoff = new Date(
      Date.now() - 4 * 7 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const start = Date.now();
    let totalDeleted = 0;
    let batchIds: string[] = [];
    do {
      const fetchResult = await getExpiredNotificationLogIdsBatchSdk(
        client,
      ).GetExpiredNotificationLogIdsBatch({
        beforeDate: cutoff,
        batchSize: BATCH_SIZE,
      });
      batchIds = fetchResult.notification_log.map((row) => row.id);

      if (batchIds.length === 0) {
        break;
      }

      await deleteExpiredNotificationLogsSdk(
        client,
      ).DeleteExpiredNotificationLogs({
        notificationLogIds: batchIds,
      });
      totalDeleted += batchIds.length;

      if (batchIds.length < BATCH_SIZE) {
        break;
      }

      if (Date.now() - start + DELAY_MS > TIME_BUDGET_MS) {
        logger.info(
          "delete-expired-notification-logs: time budget reached, deferring remainder to next run",
          { totalDeleted },
        );
        break;
      }

      await new Promise((r) => setTimeout(r, DELAY_MS));
    } while (batchIds.length === BATCH_SIZE);
  } catch (err) {
    logger.error("Failed to delete expired notification logs", {
      error: err,
      req,
    });
    return errorResponse({
      statusCode: 500,
      code: "server_error",
      detail: "Failed to delete expired notification logs",
      req,
    });
  }

  return NextResponse.json(
    {
      success: true,
    },
    { status: 200 },
  );
};
