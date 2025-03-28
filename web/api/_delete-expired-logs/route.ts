import { NextRequest, NextResponse } from "next/server";
import { errorNotAllowed } from "../helpers/errors";
import { getAPIServiceGraphqlClient } from "../helpers/graphql";
import { protectInternalEndpoint } from "../helpers/utils";
import { getSdk as deleteExpiredNotificationLogsSdk } from "./graphql/delete-expired-notificationlogs.generated";

export const POST = async (req: NextRequest) => {
  if (!protectInternalEndpoint(req)) {
    return;
  }

  if (req.method !== "POST") {
    return errorNotAllowed(req.method, req);
  }

  const serviceClient = await getAPIServiceGraphqlClient();
  const fourWeeksAgo = new Date(Date.now() - 4 * 7 * 24 * 60 * 60 * 1000);

  // apart from removing these rows, the query also deletes the corresponding notification_log_wallet_address rows
  await deleteExpiredNotificationLogsSdk(
    serviceClient,
  ).DeleteExpiredNotificationLogs({
    date: fourWeeksAgo.toISOString(),
  });

  return NextResponse.json(
    {
      success: true,
    },
    { status: 200 },
  );
};
